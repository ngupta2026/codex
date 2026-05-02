import { NextResponse } from "next/server";
import { listPendingAccessRequests } from "@/lib/auth/pending-access";
import { readCurrentSession } from "@/lib/auth/session";

export async function GET() {
  const session = await readCurrentSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
  }

  const requests = await listPendingAccessRequests();
  return NextResponse.json({ requests });
}
