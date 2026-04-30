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
export const PENDING_ACCESS_COOKIE_NAME = "arogyayatra_pending_access";
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const PENDING_ACCESS_TTL_SECONDS = 60 * 60 * 24 * 7;

export type PendingAccessClaims = JWTPayload & {
  rid: string;
  uid: string;
  email: string;
  displayName: string;
  sid: string;
};

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

export async function createPendingAccessToken(input: {
  requestId: string;
  userId: string;
  email: string;
  displayName: string;
}): Promise<string> {
  const sessionId = crypto.randomUUID();

  return new SignJWT({
    rid: input.requestId,
    uid: input.userId,
    email: input.email,
    displayName: input.displayName,
    sid: sessionId
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${PENDING_ACCESS_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyPendingAccessToken(token: string): Promise<PendingAccessClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      typeof payload.rid !== "string" ||
      typeof payload.uid !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.displayName !== "string" ||
      typeof payload.sid !== "string"
    ) {
      return null;
    }
    return payload as PendingAccessClaims;
  } catch {
    return null;
  }
}
