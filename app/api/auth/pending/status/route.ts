import { NextResponse } from "next/server";
import { readPendingAccessSession } from "@/lib/auth/session";

export async function GET() {
  const pendingSession = await readPendingAccessSession();
  if (!pendingSession) {
    return NextResponse.json({ request: null }, { status: 401 });
  }

  return NextResponse.json({
    request: pendingSession,
    approved: pendingSession.status === "approved",
    submitted: pendingSession.status === "submitted",
    rejected: pendingSession.status === "rejected"
  });
}
