import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/auth/repository";
import { readCurrentSession } from "@/lib/auth/session";
import { PENDING_ACCESS_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/auth/token";

export async function POST() {
  const session = await readCurrentSession();

  if (session) {
    await recordAuditEvent({
      actorId: session.userId,
      actorRole: session.role,
      eventType: "auth_access",
      summary: `User ${session.displayName} signed out.`
    });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0)
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
