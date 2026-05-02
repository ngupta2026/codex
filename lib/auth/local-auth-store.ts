import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AuthenticatedAppRole, PendingAccessRequestContract } from "@/lib/app-foundation";

export type LocalAuthStatus = "active" | "invited" | "pending_approval";

export type LocalAuthUserRecord = {
  id: string;
  role: AuthenticatedAppRole;
  email: string;
  username: string;
  phone: string;
  displayName: string;
  linkedEntityId?: string;
  authStatus: LocalAuthStatus;
  lastLoginAt?: string;
  scopeSummary?: string;
  passwordHash: string;
};

type LocalAuthStore = {
  users: LocalAuthUserRecord[];
  pendingRequests: PendingAccessRequestContract[];
};

const STORE_DIR = path.join(process.cwd(), ".tmp");
const STORE_FILE = path.join(STORE_DIR, "pending-access-local.json");

function defaultStore(): LocalAuthStore {
  return {
    users: [],
    pendingRequests: []
  };
}

async function ensureStoreDir(): Promise<void> {
  await mkdir(STORE_DIR, { recursive: true });
}

async function writeStore(store: LocalAuthStore): Promise<void> {
  await ensureStoreDir();
  await writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

export async function readLocalAuthStore(): Promise<LocalAuthStore> {
  try {
    const raw = await readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalAuthStore> | null;
    return {
      users: Array.isArray(parsed?.users) ? parsed!.users : [],
      pendingRequests: Array.isArray(parsed?.pendingRequests) ? parsed!.pendingRequests : []
    };
  } catch {
    return defaultStore();
  }
}

export async function mutateLocalAuthStore(
  mutator: (store: LocalAuthStore) => LocalAuthStore | Promise<LocalAuthStore>
): Promise<LocalAuthStore> {
  const current = await readLocalAuthStore();
  const next = await mutator({
    users: [...current.users],
    pendingRequests: [...current.pendingRequests]
  });
  await writeStore(next);
  return next;
}

export async function listLocalAuthUsers(): Promise<LocalAuthUserRecord[]> {
  return (await readLocalAuthStore()).users;
}

export async function listLocalPendingRequests(): Promise<PendingAccessRequestContract[]> {
  return (await readLocalAuthStore()).pendingRequests;
}

export async function findLocalAuthUserById(userId: string): Promise<LocalAuthUserRecord | null> {
  return (await readLocalAuthStore()).users.find((user) => user.id === userId) ?? null;
}

export async function findLocalAuthUserByIdentifier(identifier: string): Promise<LocalAuthUserRecord | null> {
  const normalized = identifier.trim().toLowerCase();
  if (!normalized) return null;

  return (
    (await readLocalAuthStore()).users.find(
      (user) =>
        user.email.toLowerCase() === normalized ||
        user.username.toLowerCase() === normalized
    ) ?? null
  );
}

export async function updateLocalAuthUserLastLogin(userId: string): Promise<void> {
  await mutateLocalAuthStore((store) => ({
    ...store,
    users: store.users.map((user) =>
      user.id === userId
        ? {
            ...user,
            lastLoginAt: new Date().toISOString()
          }
        : user
    )
  }));
}
