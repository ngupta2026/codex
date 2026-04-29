import { createRemoteJWKSet, jwtVerify } from "jose";
import { safeInternalRedirectPath } from "@/lib/auth/access";

export const GOOGLE_OAUTH_STATE_COOKIE_NAME = "arogyayatra_google_oauth";

type GoogleOAuthState = {
  state: string;
  nonce: string;
  redirectTo: string;
};

type GoogleTokenResponse = {
  id_token?: string;
  error?: string;
  error_description?: string;
};

const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured.");
  }

  return { clientId, clientSecret };
}

export function isGoogleAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function buildGoogleCallbackUrl(origin: string): string {
  return new URL("/api/auth/google/callback", origin).toString();
}

export function createGoogleOAuthState(redirectTo?: string | null): GoogleOAuthState {
  return {
    state: crypto.randomUUID(),
    nonce: crypto.randomUUID(),
    redirectTo: safeInternalRedirectPath(redirectTo) ?? "/"
  };
}

export function encodeGoogleOAuthStateCookie(value: GoogleOAuthState): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

export function decodeGoogleOAuthStateCookie(rawValue?: string): GoogleOAuthState | null {
  if (!rawValue) return null;

  try {
    const decoded = Buffer.from(rawValue, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as Partial<GoogleOAuthState>;
    if (typeof parsed.state !== "string" || typeof parsed.nonce !== "string") return null;

    return {
      state: parsed.state,
      nonce: parsed.nonce,
      redirectTo: safeInternalRedirectPath(parsed.redirectTo) ?? "/"
    };
  } catch {
    return null;
  }
}

export function buildGoogleAuthorizationUrl(origin: string, oauthState: GoogleOAuthState): string {
  const { clientId } = googleConfig();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", buildGoogleCallbackUrl(origin));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", oauthState.state);
  url.searchParams.set("nonce", oauthState.nonce);
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("include_granted_scopes", "true");
  return url.toString();
}

export async function exchangeGoogleAuthorizationCode(origin: string, code: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = googleConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: buildGoogleCallbackUrl(origin),
      grant_type: "authorization_code"
    })
  });

  const payload = (await response.json().catch(() => null)) as GoogleTokenResponse | null;
  if (!response.ok || !payload?.id_token) {
    throw new Error(payload?.error_description || payload?.error || "Google token exchange failed.");
  }

  return payload;
}

export async function verifyGoogleIdToken(idToken: string, expectedNonce: string) {
  const { clientId } = googleConfig();
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    audience: clientId,
    issuer: GOOGLE_ISSUERS
  });

  if (typeof payload.email !== "string" || typeof payload.sub !== "string") {
    throw new Error("Google identity payload is missing the required email or subject.");
  }

  if (typeof payload.nonce !== "string" || payload.nonce !== expectedNonce) {
    throw new Error("Google nonce validation failed.");
  }

  return {
    email: payload.email,
    emailVerified: payload.email_verified === true,
    name: typeof payload.name === "string" ? payload.name : payload.email,
    subject: payload.sub
  };
}
