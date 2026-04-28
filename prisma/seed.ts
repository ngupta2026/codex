import { PrismaClient, AuthStatus, FeedbackUserType, JourneyStage, UserRole } from "@prisma/client";
import { hashSync } from "bcryptjs";
import {
  admins,
  authUsers,
  developers,
  nurses,
  patients,
  pharmacists,
  type AuthUserSeed,
  type Patient
} from "../lib/arogyayatra-data";

const prisma = new PrismaClient();

const DEMO_PASSWORDS: Record<Exclude<AuthUserSeed["role"], "home" | "feedback">, string> = {
  admin: "Admin123!",
  developer: "Developer123!",
  patient: "Patient123!",
  nurse: "Nurse123!",
  pharmacist: "Pharmacist123!"
};

function toUserRole(role: AuthUserSeed["role"]): UserRole {
  if (role === "admin") return UserRole.ADMIN;
  if (role === "developer") return UserRole.DEVELOPER;
  if (role === "patient") return UserRole.PATIENT;
  if (role === "nurse") return UserRole.NURSE;
  return UserRole.PHARMACIST;
}

function toAuthStatus(status: AuthUserSeed["authStatus"]): AuthStatus {
  return status === "invited" ? AuthStatus.INVITED : AuthStatus.ACTIVE;
}

function toJourneyStage(stage: Patient["journeyStage"]): JourneyStage {
  if (stage === "Intake") return JourneyStage.INTAKE;
  if (stage === "Assessment") return JourneyStage.ASSESSMENT;
  if (stage === "Treatment") return JourneyStage.TREATMENT;
  if (stage === "Monitoring") return JourneyStage.MONITORING;
  return JourneyStage.RECOVERY;
}

function appointmentDate(patientId: string): Date {
  const mapping: Record<string, string> = {
    "PT-1001": "2026-04-26T14:30:00-04:00",
    "PT-1002": "2026-04-26T11:00:00-04:00",
    "PT-1003": "2026-04-27T09:00:00-04:00"
  };
  return new Date(mapping[patientId] ?? "2026-04-27T10:00:00-04:00");
}

async function main() {
  await prisma.toolCall.deleteMany();
  await prisma.policyEvent.deleteMany();
  await prisma.trace.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.journeyEvent.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.vital.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.patientAssignment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.nurse.deleteMany();
  await prisma.pharmacist.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.developer.deleteMany();
  await prisma.user.deleteMany();

  const userPayloads = authUsers.map((user) => ({
    id: user.id,
    email: user.email,
    username: user.username,
    phone: user.phone,
    displayName: user.name,
    role: toUserRole(user.role),
    authStatus: toAuthStatus(user.authStatus),
    passwordHash: hashSync(DEMO_PASSWORDS[user.role], 10),
    linkedEntityId: user.linkedEntityId,
    scopeSummary: user.scopeSummary,
    lastLoginAt: new Date(user.lastLoginAt)
  }));

  await prisma.user.createMany({ data: userPayloads });

  await prisma.patient.createMany({
    data: patients.map((patient) => ({
      id: patient.id,
      userId: authUsers.find((user) => user.role === "patient" && user.linkedEntityId === patient.id)?.id,
      name: patient.name,
      diagnosis: patient.diagnosis,
      riskLabel: patient.risk,
      dischargeHoursAgo: patient.dischargeHoursAgo,
      critical: patient.critical,
      currentBarrier: patient.barrier,
      nextAction: patient.nextAction,
      messageCount: patient.messages,
      currentJourneyStage: toJourneyStage(patient.journeyStage)
    }))
  });

  await prisma.nurse.createMany({
    data: nurses.map((nurse) => ({
      id: nurse.id,
      userId: authUsers.find((user) => user.role === "nurse" && user.linkedEntityId === nurse.id)?.id,
      name: nurse.name,
      specialty: nurse.specialty,
      shift: nurse.shift,
      responseMinutes: nurse.responseMinutes
    }))
  });

  await prisma.pharmacist.createMany({
    data: pharmacists.map((pharmacist) => ({
      id: pharmacist.id,
      userId: authUsers.find((user) => user.role === "pharmacist" && user.linkedEntityId === pharmacist.id)?.id,
      name: pharmacist.name,
      focus: pharmacist.focus,
      queueSize: pharmacist.queueSize,
      fillsToday: pharmacist.fillsToday
    }))
  });

  await prisma.admin.createMany({
    data: admins.map((admin) => ({
      id: admin.id,
      userId: authUsers.find((user) => user.role === "admin" && user.linkedEntityId === admin.id)?.id,
      name: admin.name,
      title: admin.title,
      scope: admin.scope
    }))
  });

  await prisma.developer.createMany({
    data: developers.map((developer) => ({
      id: developer.id,
      userId: authUsers.find((user) => user.role === "developer" && user.linkedEntityId === developer.id)?.id,
      name: developer.name,
      title: developer.title,
      focus: developer.focus
    }))
  });

  await prisma.patientAssignment.createMany({
    data: patients.map((patient) => ({
      patientId: patient.id,
      nurseId: nurses.find((nurse) => nurse.name === patient.nurse)?.id,
      pharmacistId: pharmacists.find((pharmacist) => pharmacist.name === patient.pharmacist)?.id,
      active: true
    }))
  });

  for (const patient of patients) {
    const [medicationName, medicationDose = ""] = patient.medication.split(/\s(.+)/);
    await prisma.medication.create({
      data: {
        patientId: patient.id,
        name: medicationName,
        dose: medicationDose,
        refillStatus: patient.refillStatus,
        note: patient.barrier
      }
    });

    await prisma.vital.createMany({
      data: patient.vitals.map((vital, index) => ({
        patientId: patient.id,
        label: vital.label,
        value: vital.value,
        note: vital.note,
        recordedAt: new Date(Date.now() - index * 5 * 60 * 1000)
      }))
    });

    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        title: patient.appointment,
        scheduledAt: appointmentDate(patient.id),
        notes: patient.nextAction
      }
    });

    await prisma.journeyEvent.create({
      data: {
        patientId: patient.id,
        stage: toJourneyStage(patient.journeyStage),
        status: "current_focus",
        source: "seeded_demo_data",
        authority: "system_seed",
        rationale: patient.nextAction
      }
    });
  }

  await prisma.feedback.create({
    data: {
      userType: FeedbackUserType.CUSTOMER,
      sourceRole: "home",
      aiGoal: "care coordination",
      feedback: "Need more role clarity on the home page.",
      desiredOutcome: "Make workspace selection clearer for first-time users.",
      constraints: "Keep the tone calm and healthcare-safe."
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
