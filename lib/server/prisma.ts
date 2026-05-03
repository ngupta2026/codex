import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  __arogyayatraPrisma?: PrismaClient;
};

function resolveDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL || process.env.POSTGRES_URL;
}

function ensureDatabaseUrlEnv(): string | undefined {
  const databaseUrl = resolveDatabaseUrl();
  if (databaseUrl && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = databaseUrl;
  }
  return databaseUrl;
}

export function isDatabaseBackedAuthRequired(): boolean {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

export function canUseLocalFileAuthStorage(): boolean {
  return !isDatabaseBackedAuthRequired();
}

export function hasDatabaseUrl(): boolean {
  return Boolean(resolveDatabaseUrl());
}

export function getPrismaClient(): PrismaClient {
  const databaseUrl = ensureDatabaseUrlEnv();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for Prisma-backed operations.");
  }

  if (!globalForPrisma.__arogyayatraPrisma) {
    globalForPrisma.__arogyayatraPrisma = new PrismaClient();
  }

  return globalForPrisma.__arogyayatraPrisma;
}
