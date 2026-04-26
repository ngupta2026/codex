import {
  getPatientById,
  nurses,
  patients,
  patientsForNurse,
  patientsForPharmacist,
  pharmacists,
  priorityNurses,
  priorityPatients,
  priorityPharmacists,
  type Nurse,
  type Patient,
  type Pharmacist,
  type Role
} from "@/lib/arogyayatra-data";
import { CaseInput } from "@/lib/contracts";

export type CareContext = {
  role: Role;
  patient: Patient;
  assignedNurse: Nurse | null;
  assignedPharmacist: Pharmacist | null;
  nursePatients: Patient[];
  pharmacistPatients: Patient[];
  topPatients: Patient[];
  topNurses: Nurse[];
  topPharmacists: Pharmacist[];
  pageSummary: string;
  caseInput: CaseInput;
};

function pageSummary(role: Role): string {
  if (role === "home") return "Landing page for role routing, care journey orientation, and care-team visibility.";
  if (role === "admin") return "Operations page for priority coordination, workload pressure, pharmacy blockers, and appointments.";
  if (role === "patient") return "Patient page for medicines, appointments, vitals, safety guidance, and virtual visit readiness.";
  if (role === "nurse") return "Nurse page for triage review, daily patient load, and follow-up coordination.";
  if (role === "pharmacist") return "Pharmacist page for refill blockers, fill queue, and adherence continuity.";
  if (role === "feedback") return "AI Enabled Feedback board for collecting workflow feedback and generating structured AI feature prompts.";
  return "Developer board for multi-agent observability, trace inspection, and AI workflow operations.";
}

function extractFirstNumber(raw: string): number | undefined {
  const match = raw.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

function lookupVital(patient: Patient, labelPattern: RegExp): number | undefined {
  const vital = patient.vitals.find((entry) => labelPattern.test(entry.label));
  return vital ? extractFirstNumber(vital.value) : undefined;
}

function inferSymptomReport(patient: Patient): string {
  const diagnosis = patient.diagnosis.toLowerCase();
  const barrier = patient.barrier.toLowerCase();
  const refill = patient.refillStatus.toLowerCase();

  if (diagnosis.includes("chest pain") || barrier.includes("escalation")) {
    return "Chest pain symptoms persisted overnight with dizziness during recovery check-in.";
  }

  if (diagnosis.includes("fluid retention") || refill.includes("pickup delayed")) {
    return "Breathing feels heavier today and medication pickup delay may disrupt recovery.";
  }

  if (diagnosis.includes("wound")) {
    return "Wound recovery remains stable with mild soreness and no fever today.";
  }

  return patient.barrier !== "None" ? patient.barrier : `${patient.diagnosis} remains under post-discharge observation.`;
}

function inferTransportStatus(patient: Patient): { status: string; constraints: string[] } {
  const combined = `${patient.barrier} ${patient.refillStatus}`.toLowerCase();
  if (/delay|pickup|transport|ride|insurance|missed/.test(combined)) {
    return {
      status: "pending_confirmation",
      constraints: [patient.barrier !== "None" ? patient.barrier : patient.refillStatus]
    };
  }

  return {
    status: "confirmed",
    constraints: []
  };
}

function buildCaseInput(patient: Patient): CaseInput {
  const transport = inferTransportStatus(patient);
  const adherenceBarriers = patient.barrier !== "None" ? [patient.barrier] : [];
  const pickupIssues = /on hand/i.test(patient.refillStatus) ? [] : [patient.refillStatus];
  const appointmentPending = transport.constraints.length > 0 ? [patient.nextAction] : [];

  return {
    case_id: `CASE-${patient.id}`,
    patient_id: patient.id,
    patient_name: patient.name,
    symptom_report: inferSymptomReport(patient),
    vitals_snapshot: {
      oxygen_saturation_pct: lookupVital(patient, /oxygen/i),
      heart_rate_bpm: lookupVital(patient, /heart rate/i),
      temperature_f: lookupVital(patient, /temperature/i)
    },
    discharge_instructions: [
      `Follow current recovery stage: ${patient.journeyStage}.`,
      `Complete next action: ${patient.nextAction}.`,
      `Keep appointment active: ${patient.appointment}.`
    ],
    medication_status: {
      current_medications: [patient.medication],
      refill_state: [patient.refillStatus],
      adherence_barriers: adherenceBarriers,
      pickup_or_delivery_issues: pickupIssues
    },
    appointments: {
      scheduled: [patient.appointment],
      pending: appointmentPending,
      missed: []
    },
    transport_access: transport,
    pharmacy_refill_status: {
      status: /on hand/i.test(patient.refillStatus) ? "on_track" : "needs_follow_up",
      notes: [patient.refillStatus]
    }
  };
}

export function loadCareContext(role: Role, patientId: string): CareContext {
  const patient = getPatientById(patientId);
  const assignedNurse = nurses.find((entry) => entry.name === patient.nurse) ?? null;
  const assignedPharmacist = pharmacists.find((entry) => entry.name === patient.pharmacist) ?? null;

  return {
    role,
    patient,
    assignedNurse,
    assignedPharmacist,
    nursePatients: patientsForNurse(patient.nurse),
    pharmacistPatients: patientsForPharmacist(patient.pharmacist),
    topPatients: priorityPatients().slice(0, Math.min(3, patients.length)),
    topNurses: priorityNurses().slice(0, Math.min(3, nurses.length)),
    topPharmacists: priorityPharmacists().slice(0, Math.min(3, pharmacists.length)),
    pageSummary: pageSummary(role),
    caseInput: buildCaseInput(patient)
  };
}
