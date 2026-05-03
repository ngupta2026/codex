import { NextResponse } from "next/server";
import { listLocalAuthUsers } from "@/lib/auth/local-auth-store";
import { readCurrentSession } from "@/lib/auth/session";
import { getPrismaClient, hasDatabaseUrl } from "@/lib/server/prisma";

export type AdminUserSummary = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
  authStatus: string;
  lastLoginAt: string | null;
  createdAt: string;
};

export async function GET() {
  const session = await readCurrentSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
  }

  if (hasDatabaseUrl()) {
    try {
      const users = await getPrismaClient().user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          role: true,
          authStatus: true,
          lastLoginAt: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" }
      });

      const result: AdminUserSummary[] = users.map((user) => ({
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role.toLowerCase(),
        authStatus: user.authStatus.toLowerCase(),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString()
      }));

      return NextResponse.json({ users: result, source: "database" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return NextResponse.json({ error: `Database query failed: ${message}` }, { status: 500 });
    }
  }

  // Local file fallback (dev only)
  const localUsers = await listLocalAuthUsers();
  const result: AdminUserSummary[] = localUsers.map((user) => ({
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    authStatus: user.authStatus,
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: new Date(0).toISOString()
  }));

  return NextResponse.json({ users: result, source: "local" });
}
