import { NextResponse } from "next/server";
import { createPublicPendingAccessRequest } from "@/lib/auth/pending-access";
import { recordAuditEvent } from "@/lib/auth/repository";
import { createPendingAccessToken, PENDING_ACCESS_COOKIE_NAME } from "@/lib/auth/token";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        displayName?: string;
        email?: string;
        provider?: string;
        requestDetails?: string;
      }
    | null;

  const displayName = body?.displayName?.trim() || "";
  const email = body?.email?.trim().toLowerCase() || "";
  const provider = body?.provider?.trim() || "manual";
  const requestDetails = body?.requestDetails?.trim() || "";

  if (!displayName || !email) {
    return NextResponse.json({ error: "Name and email are required before requesting access." }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address before requesting access." }, { status: 400 });
  }

  const result = await createPublicPendingAccessRequest({
    displayName,
    email,
    provider,
    requestDetails,
    desiredRole: "patient"
  });

  if (result.kind === "database_unavailable") {
    return NextResponse.json({ error: "Request access requires the database-backed approval workflow to be enabled." }, { status: 503 });
  }

  if (result.kind === "already_provisioned") {
    return NextResponse.json({ error: "This email is already provisioned. Use Sign in instead of Request access." }, { status: 409 });
  }

  if (!("request" in result)) {
    return NextResponse.json({ error: "Unable to create the access request right now." }, { status: 500 });
  }

  const requestRecord = result.request;

  await recordAuditEvent({
    actorId: requestRecord.userId,
    actorRole: "feedback",
    eventType: "access_request_submitted",
    summary: `Created pending access request for ${requestRecord.email}.`,
    metadata: {
      requestId: requestRecord.id,
      provider: requestRecord.provider,
      desiredRole: requestRecord.desiredRole
    }
  });

  const token = await createPendingAccessToken({
    requestId: requestRecord.id,
    userId: requestRecord.userId,
    email: requestRecord.email,
    displayName: requestRecord.displayName
  });

  const response = NextResponse.json({
    request: requestRecord,
    created: result.kind === "created"
  });

  response.cookies.set(PENDING_ACCESS_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  return response;
}
