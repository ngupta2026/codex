import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildSessionForUser, findAuthUserByIdentifier, recordAuditEvent, roleHomePath, updateLastLogin } from "@/lib/auth/repository";
import {
  decodeGoogleOAuthStateCookie,
  exchangeGoogleAuthorizationCode,
  GOOGLE_OAUTH_STATE_COOKIE_NAME,
  isGoogleAuthConfigured,
  verifyGoogleIdToken
} from "@/lib/auth/google";
import { createSessionToken } from "@/lib/auth/session";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/token";

export const runtime = "nodejs";

function redirectWithAuthState(request: Request, authState: string) {
  return NextResponse.redirect(new URL(`/?auth=${encodeURIComponent(authState)}`, request.url));
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
      const response = redirectWithAuthState(request, "google_access_denied");
      response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE_NAME);
      return response;
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
    response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE_NAME);
    return response;
  } catch {
    const response = redirectWithAuthState(request, "google_failed");
    response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE_NAME);
    return response;
  }
}
