import { NextResponse } from "next/server";
import { canUseLocalFileAuthStorage, hasDatabaseUrl, isDatabaseBackedAuthRequired, getPrismaClient } from "@/lib/server/prisma";

export const runtime = "nodejs";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  const prismaUrl = process.env.PRISMA_DATABASE_URL;
  const postgresUrl = process.env.POSTGRES_URL;

  const info: Record<string, unknown> = {
    hasDatabaseUrl: hasDatabaseUrl(),
    isDatabaseBackedAuthRequired: isDatabaseBackedAuthRequired(),
    canUseLocalFileAuthStorage: canUseLocalFileAuthStorage(),
    vercel: process.env.VERCEL,
    nodeEnv: process.env.NODE_ENV,
    vercelRegion: process.env.VERCEL_REGION,
    vercelUrl: process.env.VERCEL_URL,
    databaseUrlSet: Boolean(dbUrl),
    prismaUrlSet: Boolean(prismaUrl),
    postgresUrlSet: Boolean(postgresUrl),
    // Show only the host portion to avoid leaking credentials
    databaseUrlHost: dbUrl ? dbUrl.replace(/\/\/[^@]+@/, "//***@") : null,
    prismaUrlHost: prismaUrl ? prismaUrl.replace(/\/\/[^@]+@/, "//***@") : null,
  };

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ status: "no_database_url", ...info });
  }

  try {
    const prisma = getPrismaClient();
    const userCount = await prisma.user.count();
    const pendingCount = await prisma.pendingAccessRequest.count();
    return NextResponse.json({
      status: "ok",
      userCount,
      pendingCount,
      ...info
    });
  } catch (error) {
    return NextResponse.json({
      status: "prisma_error",
      errorMessage: error instanceof Error ? error.message : String(error),
      errorCode: (error as Record<string, unknown>)?.code,
      ...info
    }, { status: 500 });
  }
}
