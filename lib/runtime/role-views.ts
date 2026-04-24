import {
  CoordinationPlan,
  DischargeChecklist,
  MedicationAssessment,
  MISSING_VALUE,
  NurseView,
  PatientView,
  PharmacistView,
  ResponseContract
} from "@/lib/contracts";
import { isMissingValue } from "@/lib/runtime/normalizers";

export function projectPatientView(response: ResponseContract, checklist: DischargeChecklist, logistics: CoordinationPlan): PatientView {
  return {
    role: "patient",
    what_to_do_now: response.immediate_actions,
    today_checklist: checklist.daily_checklist,
    medication_reminders: checklist.medication_schedule,
    appointment_reminders: logistics.appointment_status,
    symptom_watch_list: response.key_findings,
    when_to_call_for_help: response.escalation_required
      ? "Call emergency services immediately if symptoms worsen while waiting for nurse instructions."
      : "Call your care team the same day if symptoms get worse or medication and transport tasks fail.",
    patient_summary: response.patient_summary
  };
}

export function projectNurseView(response: ResponseContract, logistics: CoordinationPlan): NurseView {
  return {
    role: "nurse",
    risk_banner: response.risk_status,
    triage_summary: response.clinician_summary,
    vitals_or_signals: response.key_findings,
    unresolved_logistics_blockers: logistics.barriers,
    same_day_follow_up_actions: response.action_timeline.same_day,
    escalation_required: response.escalation_required,
    policy_triggers: response.policy_triggers,
    task_queue: response.immediate_actions,
    reasoning_log: response.reasoning_log,
    clinician_summary: response.clinician_summary
  };
}

export function projectPharmacistView(response: ResponseContract, medication: MedicationAssessment): PharmacistView {
  const unavailableData: string[] = [];
  for (const entry of [
    ...medication.medication_reconciliation,
    ...medication.refill_status,
    ...medication.adherence_barriers,
    ...medication.delivery_pickup_issues
  ]) {
    if (isMissingValue(entry)) {
      unavailableData.push(MISSING_VALUE);
    }
  }

  return {
    role: "pharmacist",
    medication_reconciliation: medication.medication_reconciliation,
    refill_status: medication.refill_status,
    adherence_barriers: medication.adherence_barriers,
    issue_flags: medication.issue_flags,
    delivery_pickup_issues: medication.delivery_pickup_issues,
    patient_contact_status: medication.patient_contact_status,
    medication_action_queue: medication.medication_action_queue,
    unavailable_data: unavailableData,
    pharmacist_summary: response.pharmacist_summary
  };
}
