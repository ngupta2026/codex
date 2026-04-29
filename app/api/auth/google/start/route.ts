import { NextResponse } from "next/server";
import { safeInternalRedirectPath } from "@/lib/auth/access";
import {
  buildGoogleAuthorizationUrl,
  createGoogleOAuthState,
  encodeGoogleOAuthStateCookie,
  GOOGLE_OAUTH_STATE_COOKIE_NAME,
  isGoogleAuthConfigured
} from "@/lib/auth/google";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectTo = safeInternalRedirectPath(url.searchParams.get("redirectTo")) ?? "/";

  if (!isGoogleAuthConfigured()) {
    return NextResponse.redirect(new URL("/?auth=google_unavailable", request.url));
  }

  const oauthState = createGoogleOAuthState(redirectTo);
  const response = NextResponse.redirect(buildGoogleAuthorizationUrl(url.origin, oauthState));

  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE_NAME, encodeGoogleOAuthStateCookie(oauthState), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10
  });

  return response;
}
