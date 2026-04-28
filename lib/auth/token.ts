import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { AuthenticatedAppRole } from "@/lib/app-foundation";

export type SessionClaims = JWTPayload & {
  uid: string;
  role: AuthenticatedAppRole;
  linkedEntityId?: string;
  displayName: string;
  sid: string;
};

export const SESSION_COOKIE_NAME = "arogyayatra_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function authSecret(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production" && (process.env.VERCEL === "1" || process.env.RENDER === "true" || process.env.AUTH_STRICT === "true")) {
    throw new Error("AUTH_SECRET is required in production.");
  }
  return "arogyayatra-local-dev-secret";
}

function secretKey(): Uint8Array {
  return new TextEncoder().encode(authSecret());
}

export async function createSessionToken(input: {
  userId: string;
  role: AuthenticatedAppRole;
  linkedEntityId?: string;
  displayName: string;
}): Promise<string> {
  const sessionId = crypto.randomUUID();

  return new SignJWT({
    uid: input.userId,
    role: input.role,
    linkedEntityId: input.linkedEntityId,
    displayName: input.displayName,
    sid: sessionId
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      typeof payload.uid !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.displayName !== "string" ||
      typeof payload.sid !== "string"
    ) {
      return null;
    }
    return payload as SessionClaims;
  } catch {
    return null;
  }
}
