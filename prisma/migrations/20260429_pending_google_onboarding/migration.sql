ALTER TYPE "AuthStatus" ADD VALUE IF NOT EXISTS 'PENDING_APPROVAL';
CREATE TYPE "PendingAccessStatus" AS ENUM ('DETAILS_REQUIRED', 'SUBMITTED', 'APPROVED', 'REJECTED');

CREATE TABLE "PendingAccessRequest" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "googleSubject" TEXT UNIQUE,
  "displayName" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'google',
  "desiredRole" "UserRole" NOT NULL DEFAULT 'PATIENT',
  "status" "PendingAccessStatus" NOT NULL DEFAULT 'DETAILS_REQUIRED',
  "phone" TEXT,
  "dateOfBirth" TEXT,
  "addressLine" TEXT,
  "diagnosisSummary" TEXT,
  "dischargeFacility" TEXT,
  "emergencyContactName" TEXT,
  "emergencyContactPhone" TEXT,
  "submittedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "approvalNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PendingAccessRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "PendingAccessRequest_status_createdAt_idx" ON "PendingAccessRequest"("status", "createdAt");
