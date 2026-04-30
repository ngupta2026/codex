import { NextResponse } from "next/server";
import type { AuthenticatedAppRole } from "@/lib/app-foundation";
import { approvePendingAccessRequest } from "@/lib/auth/pending-access";
import { recordAuditEvent } from "@/lib/auth/repository";
import { readCurrentSession } from "@/lib/auth/session";

function isApprovedRole(value: string): value is AuthenticatedAppRole {
  return value === "admin" || value === "developer" || value === "nurse" || value === "patient" || value === "pharmacist";
}

export async function POST(request: Request, context: { params: Promise<{ requestId: string }> }) {
  const session = await readCurrentSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
  }

  const { requestId } = await context.params;
  const body = (await request.json().catch(() => null)) as { approvedRole?: string; approvalNotes?: string } | null;
  const approvedRole = body?.approvedRole?.trim() || "patient";

  if (!isApprovedRole(approvedRole)) {
    return NextResponse.json({ error: "Choose a valid role before approving access." }, { status: 400 });
  }

  const updated = await approvePendingAccessRequest({
    requestId,
    approvedRole,
    approvalNotes: body?.approvalNotes
  });

  if (!updated) {
    return NextResponse.json({ error: "Unable to approve this access request." }, { status: 404 });
  }

  await recordAuditEvent({
    actorId: session.userId,
    actorRole: session.role,
    eventType: "access_approval",
    summary: `Approved pending access for ${updated.email} as ${approvedRole}.`,
    metadata: {
      requestId: updated.id,
      approvedRole
    }
  });

  return NextResponse.json({ request: updated });
}
