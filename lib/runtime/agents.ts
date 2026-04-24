import {
  CaseInput,
  CoordinationPlan,
  DischargeChecklist,
  MedicationAssessment,
  MISSING_VALUE,
  RiskAssessment
} from "@/lib/contracts";
import { normalizeList, normalizeText } from "@/lib/runtime/normalizers";

const MODERATE_SIGNAL_PATTERNS = [
  "swollen",
  "swelling",
  "missed",
  "fatigue",
  "dizzy",
  "dizziness",
  "mild fever",
  "worse"
];

const SEVERE_SIGNAL_PATTERNS = [
  "short of breath",
  "shortness of breath",
  "chest pain",
  "confusion",
  "fainting",
  "fainted"
];

export function translatorAgent(input: CaseInput): DischargeChecklist {
  const checklist = normalizeList(input.discharge_instructions);
  const schedule = normalizeList(input.medication_status?.current_medications);
  const safetyTips =
    checklist[0] === MISSING_VALUE
      ? [MISSING_VALUE]
      : [
          "Follow checklist order: medication, symptom check, appointment planning.",
          "If a task cannot be completed, contact care coordination the same day."
        ];

  return {
    daily_checklist: checklist,
    medication_schedule: schedule,
    safety_tips: safetyTips
  };
}

export function monitoringAgent(input: CaseInput, configuredRiskSignals: string[]): RiskAssessment {
  const symptomText = input.symptom_report.toLowerCase();
  const concerningSignals = configuredRiskSignals.filter((signal) => {
    if (signal === "shortness_of_breath") return symptomText.includes("short") && symptomText.includes("breath");
    if (signal === "chest_pain") return symptomText.includes("chest pain");
    if (signal === "dizziness_with_instability") return symptomText.includes("dizzy") || symptomText.includes("dizziness");
    if (signal === "confusion_or_fainting") return symptomText.includes("confusion") || symptomText.includes("faint");
    if (signal === "rapidly_worsening_swelling") return symptomText.includes("swelling") && symptomText.includes("wors");
    return false;
  });

  const hasSeverePattern = SEVERE_SIGNAL_PATTERNS.some((pattern) => symptomText.includes(pattern));
  const moderateCount = MODERATE_SIGNAL_PATTERNS.filter((pattern) => symptomText.includes(pattern)).length;

  const oxygen = input.vitals_snapshot?.oxygen_saturation_pct;
  const severeVitalDrop = typeof oxygen === "number" && oxygen < 90;
  const mildVitalRisk = typeof oxygen === "number" && oxygen >= 90 && oxygen < 94;

  if (hasSeverePattern || severeVitalDrop) {
    return {
      triage_level: "high_priority_health_shift",
      concerning_signals: concerningSignals.length > 0 ? concerningSignals : ["severe_symptom_signal"],
      recommended_action: "Escalate to nurse immediately.",
      escalate_to_nurse: true
    };
  }

  if (moderateCount >= 2 || mildVitalRisk) {
    return {
      triage_level: "watch_closely",
      concerning_signals: concerningSignals.length > 0 ? concerningSignals : ["moderate_recovery_drift"],
      recommended_action: "Repeat symptom check today and clear operational blockers.",
      escalate_to_nurse: false
    };
  }

  return {
    triage_level: "routine",
    concerning_signals: concerningSignals.length > 0 ? concerningSignals : ["no_critical_signal_detected"],
    recommended_action: "Continue routine recovery plan.",
    escalate_to_nurse: false
  };
}

export function logisticsAgent(input: CaseInput): CoordinationPlan {
  const appointmentStatus = [
    ...normalizeList(input.appointments?.scheduled),
    ...normalizeList(input.appointments?.pending),
    ...normalizeList(input.appointments?.missed)
  ];

  const medicationStatus = [
    ...normalizeList(input.medication_status?.refill_state),
    ...normalizeList(input.pharmacy_refill_status?.notes)
  ];

  const barriers: string[] = [];
  const transportStatus = normalizeText(input.transport_access?.status);
  if (/pending|none|missed|unavailable/i.test(transportStatus)) {
    barriers.push("Transport barrier for required follow-up.");
  }

  for (const constraint of normalizeList(input.transport_access?.constraints)) {
    if (constraint !== MISSING_VALUE) {
      barriers.push(constraint);
    }
  }

  for (const pending of normalizeList(input.appointments?.pending)) {
    if (pending !== MISSING_VALUE) {
      barriers.push(`Appointment coordination pending: ${pending}`);
    }
  }

  return {
    medication_status: medicationStatus,
    appointment_status: appointmentStatus,
    resolved_actions: barriers.length > 0 ? ["Generated same-day logistics recovery actions."] : ["No logistical barriers detected."],
    barriers
  };
}

export function medicationAgent(input: CaseInput): MedicationAssessment {
  const refillStatus = normalizeList(input.medication_status?.refill_state);
  const adherenceBarriers = normalizeList(input.medication_status?.adherence_barriers);
  const pickupIssues = normalizeList(input.medication_status?.pickup_or_delivery_issues);

  const issueFlags = [
    ...refillStatus.filter((item) => /delay|stock|hold|not available/i.test(item)),
    ...adherenceBarriers.filter((item) => item !== MISSING_VALUE)
  ];

  const contactStatus = issueFlags.length > 0 ? "Same-day outreach recommended" : "Routine reminder cadence";
  const medicationQueue =
    issueFlags.length > 0
      ? ["Resolve refill or transfer barrier.", "Confirm patient pickup or delivery plan."]
      : ["Send standard adherence reminder."];

  return {
    medication_reconciliation: normalizeList(input.medication_status?.current_medications),
    refill_status: refillStatus,
    adherence_barriers: adherenceBarriers,
    issue_flags: issueFlags.length > 0 ? issueFlags : [],
    delivery_pickup_issues: pickupIssues,
    patient_contact_status: contactStatus,
    medication_action_queue: medicationQueue
  };
}
