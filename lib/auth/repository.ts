import { AuthStatus, FeedbackUserType, UserRole, type Prisma } from "@prisma/client";
import { hashSync } from "bcryptjs";
import type { AuthenticatedAppRole, AccessScopeContract, UserSessionContract } from "@/lib/app-foundation";
import { admins, authUsers, developers, nurses, patients, patientsForNurse, patientsForPharmacist, pharmacists } from "@/lib/arogyayatra-data";
import { findLocalAuthUserById, findLocalAuthUserByIdentifier, updateLocalAuthUserLastLogin } from "@/lib/auth/local-auth-store";
import { getPrismaClient, hasDatabaseUrl } from "@/lib/server/prisma";

export type AuthUserRecord = {
  id: string;
  role: AuthenticatedAppRole;
  email: string;
  username: string;
  phone: string;
  displayName: string;
  linkedEntityId?: string;
  authStatus: "active" | "invited" | "pending_approval";
  lastLoginAt?: string;
  scopeSummary?: string;
  passwordHash: string;
};

export type AuthenticatedSession = UserSessionContract & {
  role: AuthenticatedAppRole;
  email: string;
  username: string;
  phone: string;
  lastLoginAt?: string;
  entityIds: string[];
};

const DEMO_PASSWORDS: Record<AuthenticatedAppRole, string> = {
  admin: "Admin123!",
  developer: "Developer123!",
  nurse: "Nurse123!",
  patient: "Patient123!",
  pharmacist: "Pharmacist123!"
};

const demoHashes = new Map<AuthenticatedAppRole, string>();

function rolePasswordHash(role: AuthenticatedAppRole): string {
  const existing = demoHashes.get(role);
  if (existing) return existing;
  const value = hashSync(DEMO_PASSWORDS[role], 10);
  demoHashes.set(role, value);
  return value;
}

function isAuthenticatedRole(role: string): role is AuthenticatedAppRole {
  return role === "admin" || role === "developer" || role === "nurse" || role === "patient" || role === "pharmacist";
}

function userRoleFromPrisma(role: UserRole): AuthenticatedAppRole {
  if (role === UserRole.ADMIN) return "admin";
  if (role === UserRole.DEVELOPER) return "developer";
  if (role === UserRole.NURSE) return "nurse";
  if (role === UserRole.PATIENT) return "patient";
  return "pharmacist";
}

function authStatusFromPrisma(status: AuthStatus): "active" | "invited" | "pending_approval" {
  if (status === AuthStatus.INVITED) return "invited";
  if (status === AuthStatus.PENDING_APPROVAL) return "pending_approval";
  return "active";
}

function userRoleToPrisma(role: AuthenticatedAppRole): UserRole {
  if (role === "admin") return UserRole.ADMIN;
  if (role === "developer") return UserRole.DEVELOPER;
  if (role === "nurse") return UserRole.NURSE;
  if (role === "patient") return UserRole.PATIENT;
  return UserRole.PHARMACIST;
}

function buildDemoUsers(): AuthUserRecord[] {
  return authUsers
    .filter((user): user is typeof user & { role: AuthenticatedAppRole } => isAuthenticatedRole(user.role))
    .map((user) => ({
      id: user.id,
      role: user.role,
      email: user.email,
      username: user.username,
      phone: user.phone,
      displayName: user.name,
      linkedEntityId: user.linkedEntityId,
      authStatus: user.authStatus,
      lastLoginAt: user.lastLoginAt,
      scopeSummary: user.scopeSummary,
      passwordHash: rolePasswordHash(user.role)
    }));
}

const DEMO_USERS = buildDemoUsers();

async function findDbUser(where: Prisma.UserWhereInput): Promise<AuthUserRecord | null> {
  const user = await getPrismaClient().user.findFirst({ where });
  if (!user) return null;

  return {
    id: user.id,
    role: userRoleFromPrisma(user.role),
    email: user.email,
    username: user.username,
    phone: user.phone ?? "",
    displayName: user.displayName,
    linkedEntityId: user.linkedEntityId ?? undefined,
    authStatus: authStatusFromPrisma(user.authStatus),
    lastLoginAt: user.lastLoginAt?.toISOString(),
    scopeSummary: user.scopeSummary ?? undefined,
    passwordHash: user.passwordHash
  };
}

function findDemoUserById(userId: string): AuthUserRecord | null {
  return DEMO_USERS.find((user) => user.id === userId) ?? null;
}

function buildDemoScope(user: AuthUserRecord): AccessScopeContract & { entityIds: string[] } {
  if (user.role === "patient") {
    const entityIds = user.linkedEntityId ? [user.linkedEntityId] : [];
    return {
      kind: "patient_self",
      summary: user.scopeSummary ?? `Own patient record for ${user.displayName}`,
      entityIds
    };
  }

  if (user.role === "nurse") {
    const nurse = nurses.find((entry) => entry.id === user.linkedEntityId);
    const entityIds = nurse ? patientsForNurse(nurse.name).map((patient) => patient.id) : [];
    return {
      kind: "nurse_assignments",
      summary: user.scopeSummary ?? `Assigned patient panel for ${user.displayName}`,
      entityIds
    };
  }

  if (user.role === "pharmacist") {
    const pharmacist = pharmacists.find((entry) => entry.id === user.linkedEntityId);
    const entityIds = pharmacist ? patientsForPharmacist(pharmacist.name).map((patient) => patient.id) : [];
    return {
      kind: "pharmacy_queue",
      summary: user.scopeSummary ?? `Medication queue and linked patients for ${user.displayName}`,
      entityIds
    };
  }

  if (user.role === "admin") {
    return {
      kind: "operational_admin",
      summary: user.scopeSummary ?? admins[0]?.scope ?? "Operational coordination view",
      entityIds: patients.map((patient) => patient.id)
    };
  }

  return {
    kind: "developer_observability",
    summary: user.scopeSummary ?? developers[0]?.focus ?? "Developer observability and review tools",
    entityIds: []
  };
}

async function buildDbScope(user: AuthUserRecord): Promise<AccessScopeContract & { entityIds: string[] }> {
  const prisma = getPrismaClient();

  if (user.role === "patient") {
    return {
      kind: "patient_self",
      summary: user.scopeSummary ?? `Own patient record for ${user.displayName}`,
      entityIds: user.linkedEntityId ? [user.linkedEntityId] : []
    };
  }

  if (user.role === "nurse") {
    if (!user.linkedEntityId) {
      return {
        kind: "nurse_assignments",
        summary: user.scopeSummary ?? `Assigned patient panel for ${user.displayName}`,
        entityIds: []
      };
    }
    const assignments = await prisma.patientAssignment.findMany({
      where: { nurseId: user.linkedEntityId, active: true },
      select: { patientId: true }
    });
    return {
      kind: "nurse_assignments",
      summary: user.scopeSummary ?? `Assigned patient panel for ${user.displayName}`,
      entityIds: assignments.map((assignment) => assignment.patientId)
    };
  }

  if (user.role === "pharmacist") {
    if (!user.linkedEntityId) {
      return {
        kind: "pharmacy_queue",
        summary: user.scopeSummary ?? `Medication queue and linked patients for ${user.displayName}`,
        entityIds: []
      };
    }
    const assignments = await prisma.patientAssignment.findMany({
      where: { pharmacistId: user.linkedEntityId, active: true },
      select: { patientId: true }
    });
    return {
      kind: "pharmacy_queue",
      summary: user.scopeSummary ?? `Medication queue and linked patients for ${user.displayName}`,
      entityIds: assignments.map((assignment) => assignment.patientId)
    };
  }

  if (user.role === "admin") {
    const patientIds = await prisma.patient.findMany({ select: { id: true } });
    return {
      kind: "operational_admin",
      summary: user.scopeSummary ?? "Operational coordination view",
      entityIds: patientIds.map((patient) => patient.id)
    };
  }

  return {
    kind: "developer_observability",
    summary: user.scopeSummary ?? "Developer observability and review tools",
    entityIds: []
  };
}

export function getDemoPasswordHints(): Record<AuthenticatedAppRole, string> {
  return { ...DEMO_PASSWORDS };
}

export async function findAuthUserByIdentifier(identifier: string): Promise<AuthUserRecord | null> {
  const normalized = identifier.trim().toLowerCase();
  if (!normalized) return null;

  if (hasDatabaseUrl()) {
    try {
      const record = await findDbUser({
        OR: [{ email: normalized }, { username: normalized }]
      });
      if (record) return record;
    } catch {}
  }

  const localRecord = await findLocalAuthUserByIdentifier(normalized);
  if (localRecord) return localRecord;

  return DEMO_USERS.find(
    (user) => user.email.toLowerCase() === normalized || user.username.toLowerCase() === normalized
  ) ?? null;
}

export async function findAuthUserById(userId: string): Promise<AuthUserRecord | null> {
  if (hasDatabaseUrl()) {
    try {
      const record = await findDbUser({ id: userId });
      if (record) return record;
    } catch {}
  }
  const localRecord = await findLocalAuthUserById(userId);
  if (localRecord) return localRecord;
  return findDemoUserById(userId);
}

export async function updateLastLogin(userId: string): Promise<void> {
  if (!hasDatabaseUrl()) {
    await updateLocalAuthUserLastLogin(userId);
    return;
  }

  try {
    await getPrismaClient().user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() }
    });
  } catch {
    await updateLocalAuthUserLastLogin(userId);
  }
}

export async function buildSessionForUser(user: AuthUserRecord, sessionId: string): Promise<AuthenticatedSession | null> {
  if (user.authStatus !== "active") return null;

  let scope = buildDemoScope(user);
  if (hasDatabaseUrl()) {
    try {
      scope = await buildDbScope(user);
    } catch {
      scope = buildDemoScope(user);
    }
  }

  return {
    sessionId,
    userId: user.id,
    role: user.role,
    displayName: user.displayName,
    linkedEntityId: user.linkedEntityId,
    authenticated: true,
    issuedAt: new Date().toISOString(),
    scope: {
      kind: scope.kind,
      summary: scope.summary,
      entityIds: scope.entityIds
    },
    email: user.email,
    username: user.username,
    phone: user.phone,
    lastLoginAt: user.lastLoginAt,
    entityIds: scope.entityIds
  };
}

export function roleHomePath(session: Pick<AuthenticatedSession, "role" | "linkedEntityId">): string {
  if (session.role === "admin") return "/admin";
  if (session.role === "developer") return "/developer";
  if (session.role === "nurse") return "/nurse";
  if (session.role === "pharmacist") return "/pharmacist";
  return `/patient/${session.linkedEntityId ?? patients[0].id}`;
}

export function canAccessPatient(session: AuthenticatedSession, patientId: string): boolean {
  if (session.role === "admin") return true;
  if (session.role === "developer") return false;
  if (session.role === "patient") return session.linkedEntityId === patientId;
  return session.entityIds.includes(patientId);
}

export function resolvePatientIdForSession(
  session: AuthenticatedSession,
  requestedPatientId?: string
): string | undefined {
  if (requestedPatientId && canAccessPatient(session, requestedPatientId)) {
    return requestedPatientId;
  }

  if (session.role === "patient") {
    return session.linkedEntityId;
  }

  return session.entityIds[0] ?? (session.role === "admin" ? patients[0]?.id : undefined);
}

export async function recordAuditEvent(input: {
  actorId?: string;
  actorRole: string;
  eventType: string;
  summary: string;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  if (!hasDatabaseUrl()) return;

  try {
    await getPrismaClient().auditLog.create({
      data: {
        userId: input.actorId,
        actorRole: input.actorRole,
        eventType: input.eventType,
        summary: input.summary,
        metadata: input.metadata
      }
    });
  } catch {}
}

export async function recordFeedback(input: {
  userId?: string;
  sourceRole: string;
  patientId?: string;
  userType: string;
  aiGoal: string;
  feedback: string;
  desiredOutcome: string;
  constraints?: string;
}): Promise<void> {
  if (!hasDatabaseUrl()) return;

  try {
    await getPrismaClient().feedback.create({
      data: {
        userId: input.userId,
        sourceRole: input.sourceRole,
        patientId: input.patientId,
        userType: input.userType.toUpperCase() as FeedbackUserType,
        aiGoal: input.aiGoal,
        feedback: input.feedback,
        desiredOutcome: input.desiredOutcome,
        constraints: input.constraints
      }
    });
  } catch {}
}

export async function recordTrace(input: {
  userId?: string;
  role: AuthenticatedAppRole;
  patientId?: string;
  runtimeMode: string;
  question?: string;
  answerSummary?: string;
  toolCalls: Array<{ toolName: string; summary: string }>;
  policyEvents: Array<{ trigger: string; summary: string }>;
}): Promise<void> {
  if (!hasDatabaseUrl()) return;

  const requestKey = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    const prisma = getPrismaClient();
    await prisma.trace.create({
      data: {
        requestKey,
        userId: input.userId,
        role: userRoleToPrisma(input.role),
        patientId: input.patientId,
        runtimeMode: input.runtimeMode,
        question: input.question,
        answerSummary: input.answerSummary,
        toolCalls: {
          create: input.toolCalls.map((tool) => ({
            toolName: tool.toolName,
            summary: tool.summary
          }))
        },
        policyEvents: {
          create: input.policyEvents.map((event) => ({
            trigger: event.trigger,
            summary: event.summary
          }))
        }
      }
    });
  } catch {}
}
