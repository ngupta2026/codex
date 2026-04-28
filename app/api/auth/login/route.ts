import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { buildSessionForUser, findAuthUserByIdentifier, recordAuditEvent, roleHomePath, updateLastLogin } from "@/lib/auth/repository";
import { createSessionToken } from "@/lib/auth/session";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/token";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; identifier?: string; password?: string }
    | null;

  const identifier = body?.identifier?.trim() || body?.email?.trim() || "";
  const password = body?.password?.trim() || "";

  if (!identifier || !password) {
    return NextResponse.json({ error: "email/username and password are required" }, { status: 400 });
  }

  const user = await findAuthUserByIdentifier(identifier);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
  }

  const token = await createSessionToken(user);
  const claims = await verifySessionToken(token);
  const session = claims ? await buildSessionForUser(user, claims.sid) : null;

  if (!session) {
    return NextResponse.json({ error: "unable to create session" }, { status: 500 });
  }

  await updateLastLogin(user.id);
  await recordAuditEvent({
    actorId: user.id,
    actorRole: user.role,
    eventType: "auth_access",
    summary: `User ${user.displayName} signed in.`,
    metadata: { identifier }
  });

  const response = NextResponse.json({
    session,
    redirectTo: roleHomePath(session)
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });

  return response;
}
