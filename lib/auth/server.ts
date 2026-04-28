import { redirect } from "next/navigation";
import type { AuthenticatedAppRole } from "@/lib/app-foundation";
import { PROTECTED_ROLE_ROUTES } from "@/lib/auth/access";
import { roleHomePath, type AuthenticatedSession } from "@/lib/auth/repository";
import { readCurrentSession } from "@/lib/auth/session";

export async function getOptionalServerSession(): Promise<AuthenticatedSession | null> {
  return readCurrentSession();
}

export async function requireRoleSession(requiredRole: AuthenticatedAppRole): Promise<AuthenticatedSession> {
  const session = await readCurrentSession();

  if (!session) {
    redirect(`/?auth=required&redirectTo=${encodeURIComponent(PROTECTED_ROLE_ROUTES[requiredRole])}`);
  }

  if (session.role !== requiredRole) {
    redirect(roleHomePath(session));
  }

  return session;
}
