CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PATIENT', 'NURSE', 'PHARMACIST', 'DEVELOPER');
CREATE TYPE "AuthStatus" AS ENUM ('ACTIVE', 'INVITED');
CREATE TYPE "JourneyStage" AS ENUM ('INTAKE', 'ASSESSMENT', 'TREATMENT', 'MONITORING', 'RECOVERY');
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'MISSED', 'CANCELLED');
CREATE TYPE "TraceStatus" AS ENUM ('COMPLETED', 'BLOCKED', 'FAILED');
CREATE TYPE "FeedbackUserType" AS ENUM ('CUSTOMER', 'PATIENT', 'NURSE', 'PHARMACIST', 'ADMIN', 'CAREGIVER', 'DEVELOPER');

CREATE TABLE "User" (
  "id" VARCHAR(64) PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "username" TEXT NOT NULL UNIQUE,
  "phone" TEXT,
  "displayName" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "authStatus" "AuthStatus" NOT NULL DEFAULT 'ACTIVE',
  "passwordHash" TEXT NOT NULL,
  "linkedEntityId" TEXT,
  "scopeSummary" TEXT,
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Patient" (
  "id" VARCHAR(64) PRIMARY KEY,
  "userId" TEXT UNIQUE,
  "name" TEXT NOT NULL,
  "diagnosis" TEXT NOT NULL,
  "riskLabel" TEXT NOT NULL,
  "dischargeHoursAgo" INTEGER NOT NULL,
  "critical" BOOLEAN NOT NULL DEFAULT FALSE,
  "currentBarrier" TEXT NOT NULL,
  "nextAction" TEXT NOT NULL,
  "messageCount" INTEGER NOT NULL DEFAULT 0,
  "currentJourneyStage" "JourneyStage" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Patient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Nurse" (
  "id" VARCHAR(64) PRIMARY KEY,
  "userId" TEXT UNIQUE,
  "name" TEXT NOT NULL,
  "specialty" TEXT NOT NULL,
  "shift" TEXT NOT NULL,
  "responseMinutes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Nurse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Pharmacist" (
  "id" VARCHAR(64) PRIMARY KEY,
  "userId" TEXT UNIQUE,
  "name" TEXT NOT NULL,
  "focus" TEXT NOT NULL,
  "queueSize" INTEGER NOT NULL,
  "fillsToday" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Pharmacist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Admin" (
  "id" VARCHAR(64) PRIMARY KEY,
  "userId" TEXT UNIQUE,
  "name" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Developer" (
  "id" VARCHAR(64) PRIMARY KEY,
  "userId" TEXT UNIQUE,
  "name" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "focus" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Developer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "PatientAssignment" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL,
  "nurseId" TEXT,
  "pharmacistId" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PatientAssignment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PatientAssignment_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "Nurse"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "PatientAssignment_pharmacistId_fkey" FOREIGN KEY ("pharmacistId") REFERENCES "Pharmacist"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "PatientAssignment_nurseId_active_idx" ON "PatientAssignment"("nurseId", "active");
CREATE INDEX "PatientAssignment_pharmacistId_active_idx" ON "PatientAssignment"("pharmacistId", "active");
CREATE INDEX "PatientAssignment_patientId_active_idx" ON "PatientAssignment"("patientId", "active");

CREATE TABLE "Medication" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "dose" TEXT,
  "refillStatus" TEXT NOT NULL,
  "note" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Medication_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Medication_patientId_active_idx" ON "Medication"("patientId", "active");

CREATE TABLE "Vital" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "note" TEXT,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Vital_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Vital_patientId_recordedAt_idx" ON "Vital"("patientId", "recordedAt");

CREATE TABLE "Appointment" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Appointment_patientId_scheduledAt_idx" ON "Appointment"("patientId", "scheduledAt");

CREATE TABLE "JourneyEvent" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL,
  "stage" "JourneyStage" NOT NULL,
  "status" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "authority" TEXT NOT NULL,
  "rationale" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JourneyEvent_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "JourneyEvent_patientId_createdAt_idx" ON "JourneyEvent"("patientId", "createdAt");

CREATE TABLE "Trace" (
  "id" TEXT PRIMARY KEY,
  "requestKey" TEXT NOT NULL UNIQUE,
  "userId" TEXT,
  "role" "UserRole" NOT NULL,
  "patientId" TEXT,
  "runtimeMode" TEXT NOT NULL,
  "question" TEXT,
  "answerSummary" TEXT,
  "status" "TraceStatus" NOT NULL DEFAULT 'COMPLETED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Trace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Trace_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Trace_userId_createdAt_idx" ON "Trace"("userId", "createdAt");
CREATE INDEX "Trace_patientId_createdAt_idx" ON "Trace"("patientId", "createdAt");

CREATE TABLE "ToolCall" (
  "id" TEXT PRIMARY KEY,
  "traceId" TEXT NOT NULL,
  "toolName" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ToolCall_traceId_fkey" FOREIGN KEY ("traceId") REFERENCES "Trace"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ToolCall_traceId_createdAt_idx" ON "ToolCall"("traceId", "createdAt");

CREATE TABLE "PolicyEvent" (
  "id" TEXT PRIMARY KEY,
  "traceId" TEXT NOT NULL,
  "trigger" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PolicyEvent_traceId_fkey" FOREIGN KEY ("traceId") REFERENCES "Trace"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "PolicyEvent_traceId_createdAt_idx" ON "PolicyEvent"("traceId", "createdAt");

CREATE TABLE "Feedback" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "sourceRole" TEXT NOT NULL,
  "patientId" TEXT,
  "userType" "FeedbackUserType" NOT NULL,
  "aiGoal" TEXT NOT NULL,
  "feedback" TEXT NOT NULL,
  "desiredOutcome" TEXT NOT NULL,
  "constraints" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Feedback_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Feedback_userId_createdAt_idx" ON "Feedback"("userId", "createdAt");
CREATE INDEX "Feedback_patientId_createdAt_idx" ON "Feedback"("patientId", "createdAt");

CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "actorRole" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");
CREATE INDEX "AuditLog_eventType_createdAt_idx" ON "AuditLog"("eventType", "createdAt");
