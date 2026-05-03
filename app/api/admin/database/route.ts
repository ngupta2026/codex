import { NextResponse } from "next/server";
import { readCurrentSession } from "@/lib/auth/session";
import { getPrismaClient, hasDatabaseUrl } from "@/lib/server/prisma";

export type DatabaseTableStat = {
  table: string;
  count: number;
};

export type DatabaseViewPayload = {
  source: "database" | "unavailable";
  stats: DatabaseTableStat[];
  users: Array<{
    id: string;
    email: string;
    displayName: string;
    role: string;
    authStatus: string;
    createdAt: string;
    lastLoginAt: string | null;
  }>;
  pendingRequests: Array<{
    id: string;
    email: string;
    displayName: string;
    provider: string;
    desiredRole: string;
    status: string;
    createdAt: string;
  }>;
};

export async function GET() {
  const session = await readCurrentSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ source: "unavailable", stats: [], users: [], pendingRequests: [] } satisfies DatabaseViewPayload);
  }

  try {
    const prisma = getPrismaClient();

    const [
      userCount,
      patientCount,
      nurseCount,
      pharmacistCount,
      adminCount,
      developerCount,
      pendingCount,
      auditCount,
      feedbackCount,
      traceCount,
      users,
      pendingRequests
    ] = await Promise.all([
      prisma.user.count(),
      prisma.patient.count(),
      prisma.nurse.count(),
      prisma.pharmacist.count(),
      prisma.admin.count(),
      prisma.developer.count(),
      prisma.pendingAccessRequest.count(),
      prisma.auditLog.count(),
      prisma.feedback.count(),
      prisma.trace.count(),
      prisma.user.findMany({
        select: { id: true, email: true, displayName: true, role: true, authStatus: true, createdAt: true, lastLoginAt: true },
        orderBy: { createdAt: "desc" },
        take: 50
      }),
      prisma.pendingAccessRequest.findMany({
        select: { id: true, email: true, displayName: true, provider: true, desiredRole: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 50
      })
    ]);

    const payload: DatabaseViewPayload = {
      source: "database",
      stats: [
        { table: "User", count: userCount },
        { table: "PendingAccessRequest", count: pendingCount },
        { table: "Patient", count: patientCount },
        { table: "Nurse", count: nurseCount },
        { table: "Pharmacist", count: pharmacistCount },
        { table: "Admin", count: adminCount },
        { table: "Developer", count: developerCount },
        { table: "AuditLog", count: auditCount },
        { table: "Feedback", count: feedbackCount },
        { table: "Trace", count: traceCount }
      ],
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        role: u.role.toLowerCase(),
        authStatus: u.authStatus.toLowerCase(),
        createdAt: u.createdAt.toISOString(),
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null
      })),
      pendingRequests: pendingRequests.map((r) => ({
        id: r.id,
        email: r.email,
        displayName: r.displayName,
        provider: r.provider,
        desiredRole: r.desiredRole.toLowerCase(),
        status: r.status.toLowerCase(),
        createdAt: r.createdAt.toISOString()
      }))
    };

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Database query failed: ${message}` }, { status: 500 });
  }
}
