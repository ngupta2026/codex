import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  __arogyayatraPrisma?: PrismaClient;
};

export function isDatabaseBackedAuthRequired(): boolean {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

export function canUseLocalFileAuthStorage(): boolean {
  return !isDatabaseBackedAuthRequired();
}

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for Prisma-backed operations.");
  }

  if (!globalForPrisma.__arogyayatraPrisma) {
    globalForPrisma.__arogyayatraPrisma = new PrismaClient();
  }

  return globalForPrisma.__arogyayatraPrisma;
}
