import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createPendingGooglePatientAccess, ensurePendingAccessForUser } from "@/lib/auth/pending-access";
import { buildSessionForUser, findAuthUserByIdentifier, recordAuditEvent, roleHomePath, updateLastLogin } from "@/lib/auth/repository";
import {
  decodeGoogleOAuthStateCookie,
  exchangeGoogleAuthorizationCode,
  GOOGLE_OAUTH_STATE_COOKIE_NAME,
  isGoogleAuthConfigured,
  verifyGoogleIdToken
} from "@/lib/auth/google";
import { createSessionToken } from "@/lib/auth/session";
import { createPendingAccessToken, PENDING_ACCESS_COOKIE_NAME, SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/token";

export const runtime = "nodejs";

function redirectWithAuthState(request: Request, authState: string) {
  return NextResponse.redirect(new URL(`/?auth=${encodeURIComponent(authState)}`, request.url));
}

function redirectToRequestAccess(request: Request, provider: string) {
  const redirectUrl = new URL("/feedback", request.url);
  redirectUrl.searchParams.set("sourceRole", "home");
  redirectUrl.searchParams.set("requestAccess", "1");
  redirectUrl.searchParams.set("provider", provider);
  return NextResponse.redirect(redirectUrl);
}

async function redirectToPendingOnboarding(request: Request, input: {
  requestId: string;
  userId: string;
  email: string;
  displayName: string;
}) {
  const response = NextResponse.redirect(new URL("/", request.url));
  const token = await createPendingAccessToken(input);
  response.cookies.set(PENDING_ACCESS_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE_NAME);
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const providerError = url.searchParams.get("error");
  const cookieStore = await cookies();
  const oauthState = decodeGoogleOAuthStateCookie(cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE_NAME)?.value);

  if (!isGoogleAuthConfigured()) {
    const response = redirectWithAuthState(request, "google_unavailable");
    response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE_NAME);
    return response;
  }

  if (providerError) {
    const response = redirectWithAuthState(request, "google_denied");
    response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE_NAME);
    return response;
  }

  if (!code || !state || !oauthState || oauthState.state !== state) {
    const response = redirectWithAuthState(request, "google_failed");
    response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE_NAME);
    return response;
  }

  try {
    const tokenPayload = await exchangeGoogleAuthorizationCode(url.origin, code);
    const identity = await verifyGoogleIdToken(tokenPayload.id_token!, oauthState.nonce);

    if (!identity.emailVerified) {
      const response = redirectWithAuthState(request, "google_access_denied");
      response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE_NAME);
      return response;
    }

    const user = await findAuthUserByIdentifier(identity.email);
    if (!user) {
      const pendingAccess = await createPendingGooglePatientAccess({
        email: identity.email,
        displayName: identity.name || identity.email.split("@")[0] || "New patient",
        googleSubject: identity.subject
      });

      if (!pendingAccess) {
        const response = redirectToRequestAccess(request, "google");
        response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE_NAME);
        return response;
      }

      return redirectToPendingOnboarding(request, {
        requestId: pendingAccess.id,
        userId: pendingAccess.userId,
        email: pendingAccess.email,
        displayName: pendingAccess.displayName
      });
    }

    if (user.authStatus === "pending_approval") {
      const pendingAccess = await ensurePendingAccessForUser(
        {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role
        },
        {
          googleSubject: identity.subject,
          provider: "google"
        }
      );

      if (!pendingAccess) {
        const response = redirectToRequestAccess(request, "google");
        response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE_NAME);
        return response;
      }

      return redirectToPendingOnboarding(request, {
        requestId: pendingAccess.id,
        userId: pendingAccess.userId,
        email: pendingAccess.email,
        displayName: pendingAccess.displayName
      });
    }

    const token = await createSessionToken(user);
    const claims = await verifySessionToken(token);
    const session = claims ? await buildSessionForUser(user, claims.sid) : null;

    if (!session) {
      throw new Error("Unable to create session from Google sign-in.");
    }

    await updateLastLogin(user.id);
    await recordAuditEvent({
      actorId: user.id,
      actorRole: user.role,
      eventType: "auth_access",
      summary: `User ${user.displayName} signed in with Google.`,
      metadata: {
        provider: "google",
        email: identity.email,
        googleSubject: identity.subject
      }
    });

    const redirectTo = oauthState.redirectTo || roleHomePath(session);
    const response = NextResponse.redirect(new URL(redirectTo, request.url));
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12
    });
    response.cookies.set(PENDING_ACCESS_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(0)
    });
    response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE_NAME);
    return response;
  } catch {
    const response = redirectWithAuthState(request, "google_failed");
    response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE_NAME);
    return response;
  }
}
