import { NextResponse } from "next/server";
import { submitPendingPatientProfile } from "@/lib/auth/pending-access";
import { readPendingAccessSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const pendingSession = await readPendingAccessSession();
  if (!pendingSession) {
    return NextResponse.json({ error: "Pending onboarding session not found." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        displayName?: string;
        phone?: string;
        dateOfBirth?: string;
        addressLine?: string;
        diagnosisSummary?: string;
        dischargeFacility?: string;
        emergencyContactName?: string;
        emergencyContactPhone?: string;
      }
    | null;

  const displayName = body?.displayName?.trim() || "";
  const phone = body?.phone?.trim() || "";
  const dateOfBirth = body?.dateOfBirth?.trim() || "";
  const addressLine = body?.addressLine?.trim() || "";
  const diagnosisSummary = body?.diagnosisSummary?.trim() || "";
  const dischargeFacility = body?.dischargeFacility?.trim() || "";
  const emergencyContactName = body?.emergencyContactName?.trim() || "";
  const emergencyContactPhone = body?.emergencyContactPhone?.trim() || "";

  if (
    !displayName ||
    !phone ||
    !dateOfBirth ||
    !addressLine ||
    !diagnosisSummary ||
    !dischargeFacility ||
    !emergencyContactName ||
    !emergencyContactPhone
  ) {
    return NextResponse.json({ error: "Complete all patient information fields before continuing." }, { status: 400 });
  }

  const updated = await submitPendingPatientProfile(pendingSession.id, {
    displayName,
    phone,
    dateOfBirth,
    addressLine,
    diagnosisSummary,
    dischargeFacility,
    emergencyContactName,
    emergencyContactPhone
  });

  if (!updated) {
    return NextResponse.json({ error: "Unable to save the patient information form." }, { status: 500 });
  }

  return NextResponse.json({ request: updated });
}
