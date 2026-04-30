import { AuthStatus, PendingAccessStatus, UserRole } from "@prisma/client";
import { hashSync } from "bcryptjs";
import type { AuthenticatedAppRole, PendingAccessRequestContract, PendingAccessStatus as PendingAccessStatusContract } from "@/lib/app-foundation";
import { patients } from "@/lib/arogyayatra-data";
import { getPrismaClient, hasDatabaseUrl } from "@/lib/server/prisma";

type PendingUserSeed = {
  id: string;
  email: string;
  displayName: string;
  role: AuthenticatedAppRole;
};

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

  if (!hasDatabaseUrl()) {
    return base;
  }

  const prisma = getPrismaClient();
  let candidate = base;
  let suffix = 1;

  while (await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } })) {
    suffix += 1;
    candidate = `${base}.${suffix}`;
  }

  return candidate;
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

export async function findPendingAccessById(requestId: string): Promise<PendingAccessRequestContract | null> {
  if (!hasDatabaseUrl()) return null;

  const record = await getPrismaClient().pendingAccessRequest.findUnique({
    where: { id: requestId }
  });

  return record ? mapPendingAccess(record) : null;
}

export async function findPendingAccessByUserId(userId: string): Promise<PendingAccessRequestContract | null> {
  if (!hasDatabaseUrl()) return null;

  const record = await getPrismaClient().pendingAccessRequest.findUnique({
    where: { userId }
  });

  return record ? mapPendingAccess(record) : null;
}

export async function listPendingAccessRequests(): Promise<PendingAccessRequestContract[]> {
  if (!hasDatabaseUrl()) return [];

  const records = await getPrismaClient().pendingAccessRequest.findMany({
    where: { status: { in: [PendingAccessStatus.DETAILS_REQUIRED, PendingAccessStatus.SUBMITTED] } },
    orderBy: [{ createdAt: "desc" }]
  });

  return records.map(mapPendingAccess);
}

export async function createPendingGooglePatientAccess(input: {
  email: string;
  displayName: string;
  googleSubject?: string;
}): Promise<PendingAccessRequestContract | null> {
  if (!hasDatabaseUrl()) return null;

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
}

export async function ensurePendingAccessForUser(user: PendingUserSeed, input?: { googleSubject?: string; provider?: string }): Promise<PendingAccessRequestContract | null> {
  if (!hasDatabaseUrl()) return null;

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
  if (!hasDatabaseUrl()) return null;

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
}

export async function approvePendingAccessRequest(input: {
  requestId: string;
  approvedRole: AuthenticatedAppRole;
  approvalNotes?: string;
}): Promise<PendingAccessRequestContract | null> {
  if (!hasDatabaseUrl()) return null;

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
}
