import { cookies } from "next/headers";
import type { PendingAccessRequestContract } from "@/lib/app-foundation";
import { findPendingAccessById } from "@/lib/auth/pending-access";
import { buildSessionForUser, findAuthUserById, type AuthenticatedSession, type AuthUserRecord } from "@/lib/auth/repository";
import {
  createSessionToken as createSessionTokenFromClaims,
  PENDING_ACCESS_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  verifyPendingAccessToken,
  verifySessionToken
} from "@/lib/auth/token";

export async function createSessionToken(user: AuthUserRecord): Promise<string> {
  return createSessionTokenFromClaims({
    userId: user.id,
    role: user.role,
    linkedEntityId: user.linkedEntityId,
    displayName: user.displayName
  });
}

export async function readCurrentSession(): Promise<AuthenticatedSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const claims = await verifySessionToken(token);
  if (!claims) return null;

  const user = await findAuthUserById(claims.uid);
  if (!user || user.role !== claims.role) return null;

  return buildSessionForUser(user, claims.sid);
}

export async function readPendingAccessSession(): Promise<PendingAccessRequestContract | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PENDING_ACCESS_COOKIE_NAME)?.value;
  if (!token) return null;

  const claims = await verifyPendingAccessToken(token);
  if (!claims) return null;

  const request = await findPendingAccessById(claims.rid);
  if (!request || request.userId !== claims.uid || request.email.toLowerCase() !== claims.email.toLowerCase()) {
    return null;
  }

  return request;
}
