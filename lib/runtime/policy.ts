import { CoordinationPlan, MedicationAssessment, PolicyOutput, RiskAssessment } from "@/lib/contracts";

export class EscalationPolicyEngine {
  evaluate(risk: RiskAssessment, logistics: CoordinationPlan, medication: MedicationAssessment): PolicyOutput {
    let effectiveStatus = risk.triage_level;
    let escalated = risk.escalate_to_nurse;
    const policyNotes: string[] = [];
    const policyTriggers: string[] = [];

    const hasLogisticsBarrier = logistics.barriers.length > 0;
    const hasMedicationBarrier =
      medication.adherence_barriers.length > 0 ||
      medication.delivery_pickup_issues.length > 0 ||
      medication.refill_status.some((entry) => /delay|stock|hold|pending/i.test(entry));

    if (effectiveStatus === "routine" && (hasLogisticsBarrier || hasMedicationBarrier)) {
      effectiveStatus = "watch_closely";
      policyNotes.push("Policy override: unresolved medication or logistics barrier moved routine to watch_closely.");
      policyTriggers.push("barrier_override_watch_closely");
    }

    if (effectiveStatus === "high_priority_health_shift") {
      escalated = true;
      policyNotes.push("Policy confirmed immediate nurse escalation.");
      policyTriggers.push("human_escalation_required");
    } else if (effectiveStatus === "watch_closely") {
      policyNotes.push("Policy set intensified same-day monitoring.");
      policyTriggers.push("same_day_recheck_required");
    } else {
      policyNotes.push("Policy confirmed routine recovery path.");
      policyTriggers.push("routine_path_confirmed");
    }

    return {
      effective_status: effectiveStatus,
      escalated,
      policy_notes: policyNotes,
      policy_triggers: policyTriggers
    };
  }
}
