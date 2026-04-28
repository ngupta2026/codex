import { cookies } from "next/headers";
import { buildSessionForUser, findAuthUserById, type AuthenticatedSession, type AuthUserRecord } from "@/lib/auth/repository";
import { createSessionToken as createSessionTokenFromClaims, SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/token";

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
