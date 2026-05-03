import { AuthStatus, PendingAccessStatus, UserRole } from "@prisma/client";
import { hashSync } from "bcryptjs";
import type { AuthenticatedAppRole, PendingAccessRequestContract, PendingAccessStatus as PendingAccessStatusContract } from "@/lib/app-foundation";
import { patients } from "@/lib/arogyayatra-data";
import { mutateLocalAuthStore, readLocalAuthStore } from "@/lib/auth/local-auth-store";
import { canUseLocalFileAuthStorage, getPrismaClient, hasDatabaseUrl } from "@/lib/server/prisma";

type PendingUserSeed = {
  id: string;
  email: string;
  displayName: string;
  role: AuthenticatedAppRole;
};

export type CreatePendingAccessRequestResult =
  | { kind: "created" | "existing"; request: PendingAccessRequestContract }
  | { kind: "already_provisioned" | "database_unavailable" };

function roleToPrisma(role: AuthenticatedAppRole): UserRole {
  if (role === "admin") return UserRole.ADMIN;
  if (role === "developer") return UserRole.DEVELOPER;
  if (role === "nurse") return UserRole.NURSE;
  if (role === "patient") return UserRole.PATIENT;
  return UserRole.PHARMACIST;
}

function roleFromPrisma(role: UserRole): AuthenticatedAppRole {
  if (role === UserRole.ADMIN) return "admin";
  if (role === UserRole.DEVELOPER) return "developer";
  if (role === UserRole.NURSE) return "nurse";
  if (role === UserRole.PATIENT) return "patient";
  return "pharmacist";
}

function statusFromPrisma(status: PendingAccessStatus): PendingAccessStatusContract {
  if (status === PendingAccessStatus.SUBMITTED) return "submitted";
  if (status === PendingAccessStatus.APPROVED) return "approved";
  if (status === PendingAccessStatus.REJECTED) return "rejected";
  return "details_required";
}

function sanitizeUsernamePart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "") || "patient.user";
}

async function nextAvailableUsername(email: string): Promise<string> {
  const base = sanitizeUsernamePart(email.split("@")[0] ?? "patient.user");
  const localCandidate = async () => {
    const existingUsernames = new Set((await readLocalAuthStore()).users.map((user) => user.username));
    let candidate = base;
    let suffix = 1;

    while (existingUsernames.has(candidate)) {
      suffix += 1;
      candidate = `${base}.${suffix}`;
    }

    return candidate;
  };

  if (!hasDatabaseUrl()) {
    if (canUseLocalFileAuthStorage()) {
      return localCandidate();
    }
    throw new Error("Database URL is required to generate username in production mode.");
  }

  try {
    const prisma = getPrismaClient();
    let candidate = base;
    let suffix = 1;

    while (await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } })) {
      suffix += 1;
      candidate = `${base}.${suffix}`;
    }

    return candidate;
  } catch (error) {
    if (canUseLocalFileAuthStorage()) {
      return localCandidate();
    }
    throw error;
  }
}

function mapPendingAccess(record: {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  provider: string;
  desiredRole: UserRole;
  status: PendingAccessStatus;
  phone: string | null;
  dateOfBirth: string | null;
  addressLine: string | null;
  diagnosisSummary: string | null;
  dischargeFacility: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  submittedAt: Date | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  approvalNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PendingAccessRequestContract {
  return {
    id: record.id,
    userId: record.userId,
    email: record.email,
    displayName: record.displayName,
    provider: record.provider,
    desiredRole: roleFromPrisma(record.desiredRole),
    status: statusFromPrisma(record.status),
    phone: record.phone ?? undefined,
    dateOfBirth: record.dateOfBirth ?? undefined,
    addressLine: record.addressLine ?? undefined,
    diagnosisSummary: record.diagnosisSummary ?? undefined,
    dischargeFacility: record.dischargeFacility ?? undefined,
    emergencyContactName: record.emergencyContactName ?? undefined,
    emergencyContactPhone: record.emergencyContactPhone ?? undefined,
    submittedAt: record.submittedAt?.toISOString(),
    approvedAt: record.approvedAt?.toISOString(),
    rejectedAt: record.rejectedAt?.toISOString(),
    approvalNotes: record.approvalNotes ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function patientTemplateId(): string {
  return patients[0]?.id ?? "PT-1001";
}

function scopeSummaryForRole(role: AuthenticatedAppRole, displayName: string): string {
  if (role === "patient") return `Own patient record for ${displayName}`;
  if (role === "nurse") return `Assigned patient panel for ${displayName}`;
  if (role === "pharmacist") return `Medication queue and linked patients for ${displayName}`;
  if (role === "admin") return "Priority coordination, staffing, and workflow oversight";
  return "Developer observability and review workflows";
}

function linkedEntityIdForRole(role: AuthenticatedAppRole): string | undefined {
  if (role === "patient") return patientTemplateId();
  return undefined;
}

function buildLocalPendingRequest(input: {
  userId: string;
  email: string;
  displayName: string;
  provider: string;
  desiredRole: AuthenticatedAppRole;
  status?: PendingAccessStatusContract;
  approvalNotes?: string;
}): PendingAccessRequestContract {
  const timestamp = new Date().toISOString();
  return {
    id: `pending_${crypto.randomUUID()}`,
    userId: input.userId,
    email: input.email,
    displayName: input.displayName,
    provider: input.provider,
    desiredRole: input.desiredRole,
    status: input.status ?? "details_required",
    approvalNotes: input.approvalNotes,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

async function findLocalPendingAccessById(requestId: string): Promise<PendingAccessRequestContract | null> {
  return (await readLocalAuthStore()).pendingRequests.find((request) => request.id === requestId) ?? null;
}

async function findLocalPendingAccessByUserId(userId: string): Promise<PendingAccessRequestContract | null> {
  return (await readLocalAuthStore()).pendingRequests.find((request) => request.userId === userId) ?? null;
}

async function listLocalPendingAccessRequests(): Promise<PendingAccessRequestContract[]> {
  return (await readLocalAuthStore()).pendingRequests
    .filter((request) => request.status === "details_required" || request.status === "submitted")
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

async function createLocalPendingGooglePatientAccess(input: {
  email: string;
  displayName: string;
}): Promise<PendingAccessRequestContract | null> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();
  const existingRequest = (await readLocalAuthStore()).pendingRequests.find((request) => request.email.toLowerCase() === normalizedEmail);
  if (existingRequest) {
    return existingRequest;
  }

  const username = await nextAvailableUsername(normalizedEmail);
  const userId = `AUTH-PEND-${crypto.randomUUID().slice(0, 8)}`;
  const passwordHash = hashSync(crypto.randomUUID(), 10);
  const request = buildLocalPendingRequest({
    userId,
    email: normalizedEmail,
    displayName,
    provider: "google",
    desiredRole: "patient"
  });

  await mutateLocalAuthStore((store) => ({
    ...store,
    users: [
      ...store.users,
      {
        id: userId,
        role: "patient",
        email: normalizedEmail,
        username,
        phone: "",
        displayName,
        authStatus: "pending_approval",
        scopeSummary: "Pending patient onboarding awaiting approval",
        passwordHash
      }
    ],
    pendingRequests: [...store.pendingRequests, request]
  }));

  return request;
}

async function createLocalPublicPendingAccessRequest(input: {
  email: string;
  displayName: string;
  provider?: string;
  requestDetails?: string;
  desiredRole?: AuthenticatedAppRole;
}): Promise<CreatePendingAccessRequestResult> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();
  const provider = input.provider?.trim() || "manual";
  const requestDetails = input.requestDetails?.trim() || undefined;
  const desiredRole = input.desiredRole ?? "patient";
  const store = await readLocalAuthStore();
  const existingRequest = store.pendingRequests.find((request) => request.email.toLowerCase() === normalizedEmail);

  if (existingRequest) {
    if (existingRequest.status === "approved") {
      return { kind: "already_provisioned" };
    }

    const updatedRequest: PendingAccessRequestContract = {
      ...existingRequest,
      displayName,
      provider,
      desiredRole,
      approvalNotes: requestDetails ?? existingRequest.approvalNotes,
      updatedAt: new Date().toISOString()
    };

    await mutateLocalAuthStore((current) => ({
      ...current,
      users: current.users.map((user) =>
        user.id === existingRequest.userId
          ? {
              ...user,
              displayName
            }
          : user
      ),
      pendingRequests: current.pendingRequests.map((request) =>
        request.id === existingRequest.id ? updatedRequest : request
      )
    }));

    return { kind: "existing", request: updatedRequest };
  }

  const existingUser = store.users.find((user) => user.email.toLowerCase() === normalizedEmail);
  if (existingUser?.authStatus === "active") {
    return { kind: "already_provisioned" };
  }

  if (existingUser) {
    const pendingRequest = store.pendingRequests.find((request) => request.userId === existingUser.id);
    const request =
      pendingRequest
        ? {
            ...pendingRequest,
            displayName,
            provider,
            desiredRole,
            approvalNotes: requestDetails,
            updatedAt: new Date().toISOString()
          }
        : buildLocalPendingRequest({
            userId: existingUser.id,
            email: normalizedEmail,
            displayName,
            provider,
            desiredRole,
            approvalNotes: requestDetails
          });

    await mutateLocalAuthStore((current) => ({
      ...current,
      users: current.users.map((user) =>
        user.id === existingUser.id
          ? {
              ...user,
              displayName
            }
          : user
      ),
      pendingRequests: pendingRequest
        ? current.pendingRequests.map((entry) => (entry.id === request.id ? request : entry))
        : [...current.pendingRequests, request]
    }));

    return { kind: pendingRequest ? "existing" : "created", request };
  }

  const username = await nextAvailableUsername(normalizedEmail);
  const userId = `AUTH-PEND-${crypto.randomUUID().slice(0, 8)}`;
  const passwordHash = hashSync(crypto.randomUUID(), 10);
  const request = buildLocalPendingRequest({
    userId,
    email: normalizedEmail,
    displayName,
    provider,
    desiredRole,
    approvalNotes: requestDetails
  });

  await mutateLocalAuthStore((current) => ({
    ...current,
    users: [
      ...current.users,
      {
        id: userId,
        role: desiredRole,
        email: normalizedEmail,
        username,
        phone: "",
        displayName,
        authStatus: "pending_approval",
        scopeSummary: "Pending access request awaiting approval",
        passwordHash
      }
    ],
    pendingRequests: [...current.pendingRequests, request]
  }));

  return { kind: "created", request };
}

async function ensureLocalPendingAccessForUser(user: PendingUserSeed, input?: { provider?: string }): Promise<PendingAccessRequestContract | null> {
  const store = await readLocalAuthStore();
  const existing = store.pendingRequests.find((request) => request.userId === user.id);
  if (existing) {
    return existing;
  }

  const created = buildLocalPendingRequest({
    userId: user.id,
    email: user.email.toLowerCase(),
    displayName: user.displayName,
    provider: input?.provider ?? "google",
    desiredRole: user.role
  });

  await mutateLocalAuthStore((current) => ({
    ...current,
    pendingRequests: [...current.pendingRequests, created]
  }));

  return created;
}

async function submitLocalPendingPatientProfile(
  requestId: string,
  input: {
    displayName: string;
    phone: string;
    dateOfBirth: string;
    addressLine: string;
    diagnosisSummary: string;
    dischargeFacility: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
  }
): Promise<PendingAccessRequestContract | null> {
  const store = await readLocalAuthStore();
  const record = store.pendingRequests.find((request) => request.id === requestId);
  if (!record) return null;

  const updated: PendingAccessRequestContract = {
    ...record,
    displayName: input.displayName.trim(),
    phone: input.phone.trim(),
    dateOfBirth: input.dateOfBirth.trim(),
    addressLine: input.addressLine.trim(),
    diagnosisSummary: input.diagnosisSummary.trim(),
    dischargeFacility: input.dischargeFacility.trim(),
    emergencyContactName: input.emergencyContactName.trim(),
    emergencyContactPhone: input.emergencyContactPhone.trim(),
    status: "submitted",
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await mutateLocalAuthStore((current) => ({
    ...current,
    users: current.users.map((user) =>
      user.id === record.userId
        ? {
            ...user,
            displayName: input.displayName.trim(),
            phone: input.phone.trim()
          }
        : user
    ),
    pendingRequests: current.pendingRequests.map((request) => (request.id === requestId ? updated : request))
  }));

  return updated;
}

async function approveLocalPendingAccessRequest(input: {
  requestId: string;
  approvedRole: AuthenticatedAppRole;
  approvalNotes?: string;
}): Promise<PendingAccessRequestContract | null> {
  const store = await readLocalAuthStore();
  const record = store.pendingRequests.find((request) => request.id === input.requestId);
  if (!record) return null;

  const updated: PendingAccessRequestContract = {
    ...record,
    desiredRole: input.approvedRole,
    status: "approved",
    approvedAt: new Date().toISOString(),
    approvalNotes: input.approvalNotes?.trim() || record.approvalNotes,
    updatedAt: new Date().toISOString()
  };

  await mutateLocalAuthStore((current) => ({
    ...current,
    users: current.users.map((user) =>
      user.id === record.userId
        ? {
            ...user,
            role: input.approvedRole,
            authStatus: "active",
            linkedEntityId: linkedEntityIdForRole(input.approvedRole),
            scopeSummary: scopeSummaryForRole(input.approvedRole, record.displayName)
          }
        : user
    ),
    pendingRequests: current.pendingRequests.map((request) =>
      request.id === input.requestId ? updated : request
    )
  }));

  return updated;
}

export async function findPendingAccessById(requestId: string): Promise<PendingAccessRequestContract | null> {
  if (!hasDatabaseUrl()) {
    return canUseLocalFileAuthStorage() ? findLocalPendingAccessById(requestId) : null;
  }

  try {
    const record = await getPrismaClient().pendingAccessRequest.findUnique({
      where: { id: requestId }
    });

    return record ? mapPendingAccess(record) : null;
  } catch {
    return canUseLocalFileAuthStorage() ? findLocalPendingAccessById(requestId) : null;
  }
}

export async function findPendingAccessByUserId(userId: string): Promise<PendingAccessRequestContract | null> {
  if (!hasDatabaseUrl()) {
    return canUseLocalFileAuthStorage() ? findLocalPendingAccessByUserId(userId) : null;
  }

  try {
    const record = await getPrismaClient().pendingAccessRequest.findUnique({
      where: { userId }
    });

    return record ? mapPendingAccess(record) : null;
  } catch {
    return canUseLocalFileAuthStorage() ? findLocalPendingAccessByUserId(userId) : null;
  }
}

export async function listPendingAccessRequests(): Promise<PendingAccessRequestContract[]> {
  if (!hasDatabaseUrl()) {
    return canUseLocalFileAuthStorage() ? listLocalPendingAccessRequests() : [];
  }

  try {
    const records = await getPrismaClient().pendingAccessRequest.findMany({
      where: { status: { in: [PendingAccessStatus.DETAILS_REQUIRED, PendingAccessStatus.SUBMITTED] } },
      orderBy: [{ createdAt: "desc" }]
    });

    return records.map(mapPendingAccess);
  } catch {
    return canUseLocalFileAuthStorage() ? listLocalPendingAccessRequests() : [];
  }
}

export async function createPendingGooglePatientAccess(input: {
  email: string;
  displayName: string;
  googleSubject?: string;
}): Promise<PendingAccessRequestContract | null> {
  if (!hasDatabaseUrl()) {
    return canUseLocalFileAuthStorage() ? createLocalPendingGooglePatientAccess(input) : null;
  }

  try {
    const prisma = getPrismaClient();
    const normalizedEmail = input.email.trim().toLowerCase();
    const existing = await prisma.pendingAccessRequest.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          input.googleSubject ? { googleSubject: input.googleSubject } : undefined
        ].filter(Boolean) as Array<{ email?: string; googleSubject?: string }>
      }
    });

    if (existing) {
      return mapPendingAccess(existing);
    }

    const username = await nextAvailableUsername(normalizedEmail);
    const userId = `AUTH-PEND-${crypto.randomUUID().slice(0, 8)}`;
    const passwordHash = hashSync(crypto.randomUUID(), 10);

    const request = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: userId,
          email: normalizedEmail,
          username,
          displayName: input.displayName,
          role: UserRole.PATIENT,
          authStatus: AuthStatus.PENDING_APPROVAL,
          passwordHash,
          scopeSummary: "Pending patient onboarding awaiting approval"
        }
      });

      return tx.pendingAccessRequest.create({
        data: {
          userId: user.id,
          email: user.email,
          displayName: input.displayName,
          googleSubject: input.googleSubject,
          provider: "google",
          desiredRole: UserRole.PATIENT,
          status: PendingAccessStatus.DETAILS_REQUIRED
        }
      });
    });

    return mapPendingAccess(request);
  } catch {
    return canUseLocalFileAuthStorage() ? createLocalPendingGooglePatientAccess(input) : null;
  }
}

export async function createPublicPendingAccessRequest(input: {
  email: string;
  displayName: string;
  provider?: string;
  requestDetails?: string;
  desiredRole?: AuthenticatedAppRole;
}): Promise<CreatePendingAccessRequestResult> {
  if (!hasDatabaseUrl()) {
    return canUseLocalFileAuthStorage() ? createLocalPublicPendingAccessRequest(input) : { kind: "database_unavailable" };
  }

  try {
    const prisma = getPrismaClient();
    const normalizedEmail = input.email.trim().toLowerCase();
    const displayName = input.displayName.trim();
    const provider = input.provider?.trim() || "manual";
    const requestDetails = input.requestDetails?.trim() || null;
    const desiredRole = input.desiredRole ?? "patient";
    const desiredRoleValue = roleToPrisma(desiredRole);

    const existingRequest = await prisma.pendingAccessRequest.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingRequest) {
      if (existingRequest.status === PendingAccessStatus.APPROVED) {
        return { kind: "already_provisioned" };
      }

      const updated = await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: existingRequest.userId },
          data: {
            displayName
          }
        });

        return tx.pendingAccessRequest.update({
          where: { id: existingRequest.id },
          data: {
            displayName,
            provider,
            desiredRole: desiredRoleValue,
            approvalNotes: requestDetails ?? existingRequest.approvalNotes
          }
        });
      });

      return { kind: "existing", request: mapPendingAccess(updated) };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser?.authStatus === AuthStatus.ACTIVE) {
      return { kind: "already_provisioned" };
    }

    if (existingUser) {
      const pendingRequest = await ensurePendingAccessForUser(
        {
          id: existingUser.id,
          email: existingUser.email,
          displayName: displayName || existingUser.displayName,
          role: roleFromPrisma(existingUser.role)
        },
        {
          provider
        }
      );

      if (!pendingRequest) {
        console.error(JSON.stringify({
          fn: "createPublicPendingAccessRequest",
          outcome: "ensure_pending_returned_null",
          email: normalizedEmail,
          existingUserId: existingUser.id,
          existingUserStatus: existingUser.authStatus
        }));
        return { kind: "database_unavailable" };
      }

      const updated = await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: existingUser.id },
          data: {
            displayName
          }
        });

        return tx.pendingAccessRequest.update({
          where: { id: pendingRequest.id },
          data: {
            displayName,
            provider,
            desiredRole: desiredRoleValue,
            approvalNotes: requestDetails
          }
        });
      });

      return { kind: "existing", request: mapPendingAccess(updated) };
    }

    const username = await nextAvailableUsername(normalizedEmail);
    const userId = `AUTH-PEND-${crypto.randomUUID().slice(0, 8)}`;
    const passwordHash = hashSync(crypto.randomUUID(), 10);

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: userId,
          email: normalizedEmail,
          username,
          displayName,
          role: desiredRoleValue,
          authStatus: AuthStatus.PENDING_APPROVAL,
          passwordHash,
          scopeSummary: "Pending access request awaiting approval"
        }
      });

      return tx.pendingAccessRequest.create({
        data: {
          userId: user.id,
          email: user.email,
          displayName,
          provider,
          desiredRole: desiredRoleValue,
          status: PendingAccessStatus.DETAILS_REQUIRED,
          approvalNotes: requestDetails
        }
      });
    });

    return { kind: "created", request: mapPendingAccess(created) };
  } catch (error) {
    console.error(JSON.stringify({
      fn: "createPublicPendingAccessRequest",
      outcome: "prisma_error",
      email: input.email,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorCode: (error as Record<string, unknown>)?.code,
      errorMeta: (error as Record<string, unknown>)?.meta,
      canUseLocalFile: canUseLocalFileAuthStorage()
    }));
    return canUseLocalFileAuthStorage() ? createLocalPublicPendingAccessRequest(input) : { kind: "database_unavailable" };
  }
}

export async function ensurePendingAccessForUser(user: PendingUserSeed, input?: { googleSubject?: string; provider?: string }): Promise<PendingAccessRequestContract | null> {
  if (!hasDatabaseUrl()) {
    return canUseLocalFileAuthStorage() ? ensureLocalPendingAccessForUser(user, input) : null;
  }

  try {
    const prisma = getPrismaClient();
    const existing = await prisma.pendingAccessRequest.findUnique({
      where: { userId: user.id }
    });

    if (existing) {
      return mapPendingAccess(existing);
    }

    const created = await prisma.pendingAccessRequest.create({
      data: {
        userId: user.id,
        email: user.email.toLowerCase(),
        displayName: user.displayName,
        googleSubject: input?.googleSubject,
        provider: input?.provider ?? "google",
        desiredRole: roleToPrisma(user.role),
        status: PendingAccessStatus.DETAILS_REQUIRED
      }
    });

    return mapPendingAccess(created);
  } catch (error) {
    console.error(JSON.stringify({
      fn: "ensurePendingAccessForUser",
      outcome: "prisma_error",
      userId: user.id,
      email: user.email,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorCode: (error as Record<string, unknown>)?.code,
      errorMeta: (error as Record<string, unknown>)?.meta,
      canUseLocalFile: canUseLocalFileAuthStorage()
    }));
    return canUseLocalFileAuthStorage() ? ensureLocalPendingAccessForUser(user, input) : null;
  }
}

export async function submitPendingPatientProfile(
  requestId: string,
  input: {
    displayName: string;
    phone: string;
    dateOfBirth: string;
    addressLine: string;
    diagnosisSummary: string;
    dischargeFacility: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
  }
): Promise<PendingAccessRequestContract | null> {
  if (!hasDatabaseUrl()) {
    return canUseLocalFileAuthStorage() ? submitLocalPendingPatientProfile(requestId, input) : null;
  }

  try {
    const prisma = getPrismaClient();
    const record = await prisma.pendingAccessRequest.findUnique({
      where: { id: requestId }
    });

    if (!record) return null;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: record.userId },
        data: {
          displayName: input.displayName.trim(),
          phone: input.phone.trim()
        }
      });

      return tx.pendingAccessRequest.update({
        where: { id: requestId },
        data: {
          displayName: input.displayName.trim(),
          phone: input.phone.trim(),
          dateOfBirth: input.dateOfBirth.trim(),
          addressLine: input.addressLine.trim(),
          diagnosisSummary: input.diagnosisSummary.trim(),
          dischargeFacility: input.dischargeFacility.trim(),
          emergencyContactName: input.emergencyContactName.trim(),
          emergencyContactPhone: input.emergencyContactPhone.trim(),
          status: PendingAccessStatus.SUBMITTED,
          submittedAt: new Date()
        }
      });
    });

    return mapPendingAccess(updated);
  } catch {
    return canUseLocalFileAuthStorage() ? submitLocalPendingPatientProfile(requestId, input) : null;
  }
}

export async function approvePendingAccessRequest(input: {
  requestId: string;
  approvedRole: AuthenticatedAppRole;
  approvalNotes?: string;
}): Promise<PendingAccessRequestContract | null> {
  if (!hasDatabaseUrl()) {
    return canUseLocalFileAuthStorage() ? approveLocalPendingAccessRequest(input) : null;
  }

  try {
    const prisma = getPrismaClient();
    const record = await prisma.pendingAccessRequest.findUnique({
      where: { id: input.requestId }
    });

    if (!record) return null;

    const approvedRole = roleToPrisma(input.approvedRole);
    const linkedEntityId = linkedEntityIdForRole(input.approvedRole);
    const updated = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: record.userId },
        data: {
          role: approvedRole,
          authStatus: AuthStatus.ACTIVE,
          linkedEntityId,
          scopeSummary: scopeSummaryForRole(input.approvedRole, record.displayName)
        }
      });

      return tx.pendingAccessRequest.update({
        where: { id: input.requestId },
        data: {
          desiredRole: approvedRole,
          status: PendingAccessStatus.APPROVED,
          approvedAt: new Date(),
          approvalNotes: input.approvalNotes?.trim() || null
        }
      });
    });

    return mapPendingAccess(updated);
  } catch {
    return canUseLocalFileAuthStorage() ? approveLocalPendingAccessRequest(input) : null;
  }
}
