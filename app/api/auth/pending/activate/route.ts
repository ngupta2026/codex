import { NextResponse } from "next/server";
import { buildSessionForUser, findAuthUserById, roleHomePath } from "@/lib/auth/repository";
import { createSessionToken, readPendingAccessSession } from "@/lib/auth/session";
import { PENDING_ACCESS_COOKIE_NAME, SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/token";

export async function POST() {
  const pendingSession = await readPendingAccessSession();
  if (!pendingSession) {
    return NextResponse.json({ error: "Pending onboarding session not found." }, { status: 401 });
  }

  if (pendingSession.status !== "approved") {
    return NextResponse.json({ error: "Access approval is still in progress." }, { status: 409 });
  }

  const user = await findAuthUserById(pendingSession.userId);
  if (!user) {
    return NextResponse.json({ error: "Approved user record not found." }, { status: 404 });
  }

  const token = await createSessionToken(user);
  const claims = await verifySessionToken(token);
  const session = claims ? await buildSessionForUser(user, claims.sid) : null;

  if (!session) {
    return NextResponse.json({ error: "Unable to activate the approved dashboard session." }, { status: 500 });
  }

  const response = NextResponse.json({
    redirectTo: roleHomePath(session),
    session
  });

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

  return response;
}
