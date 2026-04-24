import {
  ActionTimeline,
  DemoCase,
  MISSING_VALUE,
  ResponseContract,
  RuntimeMode,
  Scenario
} from "@/lib/contracts";
import { loadPromptConfigSummary } from "@/lib/yaml-prompts";
import { logisticsAgent, medicationAgent, monitoringAgent, translatorAgent } from "@/lib/runtime/agents";
import { getScenarioInput, MODE_LABELS } from "@/lib/runtime/case-store";
import { EscalationPolicyEngine } from "@/lib/runtime/policy";
import { projectNurseView, projectPatientView, projectPharmacistView } from "@/lib/runtime/role-views";
import { buildToolStatus, reviewerAgent } from "@/lib/runtime/reviewer";

function composeSummaries(patientName: string, riskStatus: Scenario): { clinician: string; patient: string; pharmacist: string } {
  if (riskStatus === "high_priority_health_shift") {
    return {
      clinician: `${patientName} has a high-priority health shift. Escalate immediately and start clinician handoff.`,
      patient: "Your care team is being contacted now for urgent review of your symptoms.",
      pharmacist: "Keep medication continuity stable and prepare for escalation-driven medication updates."
    };
  }

  if (riskStatus === "watch_closely") {
    return {
      clinician: `${patientName} needs same-day monitoring and operational barrier resolution.`,
      patient: "Your recovery needs closer observation today. Complete the action list now.",
      pharmacist: "Same-day medication coordination is required to avoid missed-dose risk."
    };
  }

  return {
    clinician: `${patientName} remains on a routine recovery path with no immediate escalation.`,
    patient: "Recovery appears stable. Continue your daily checklist and reminders.",
    pharmacist: "No urgent medication intervention is required. Continue adherence reminders."
  };
}

function buildActionTimeline(status: Scenario): ActionTimeline {
  if (status === "high_priority_health_shift") {
    return {
      immediate: ["Immediate nurse callback.", "Urgent symptom triage and handoff."],
      same_day: ["Reconfirm follow-up pathway after escalation."],
      next_24h: ["Verify medication continuity post-escalation."]
    };
  }
  if (status === "watch_closely") {
    return {
      immediate: ["Resolve medication and logistics blockers.", "Re-run symptom check later today."],
      same_day: ["Confirm appointment readiness and medication pickup."],
      next_24h: ["Repeat monitoring and validate adherence."]
    };
  }
  return {
    immediate: ["Follow current medication schedule.", "Complete routine symptom check."],
    same_day: ["Keep follow-up schedule active."],
    next_24h: ["Continue recovery checklist and reminders."]
  };
}

export function resolveDemoCase(scenario: Scenario, mode: RuntimeMode): DemoCase {
  const yamlContext = loadPromptConfigSummary();
  const policy = new EscalationPolicyEngine();
  const input = getScenarioInput(scenario);
  const reasoningLog: string[] = [];

  const [checklist, risk, logistics, medication] = [
    translatorAgent(input),
    monitoringAgent(input, yamlContext.riskSignals),
    logisticsAgent(input),
    medicationAgent(input)
  ];
  reasoningLog.push("Specialist agents completed in deterministic parallel-ready pipeline.");
  reasoningLog.push(`Monitoring agent classified triage_level=${risk.triage_level}.`);
  if (logistics.barriers.length > 0) {
    reasoningLog.push("Logistics agent found unresolved barriers requiring same-day handling.");
  }
  if (medication.issue_flags.length > 0) {
    reasoningLog.push("Medication agent identified refill or adherence blockers.");
  }

  const policyOutput = policy.evaluate(risk, logistics, medication);
  reasoningLog.push(...policyOutput.policy_notes);

  const summaries = composeSummaries(input.patient_name, policyOutput.effective_status);
  const response: ResponseContract = {
    risk_status: policyOutput.effective_status,
    escalation_required: policyOutput.escalated,
    key_findings: [...risk.concerning_signals, ...medication.issue_flags].slice(0, 6),
    immediate_actions: policyOutput.escalated
      ? ["Escalate to nurse now.", ...buildActionTimeline(policyOutput.effective_status).immediate]
      : buildActionTimeline(policyOutput.effective_status).immediate,
    appointment_and_medication_facts: [
      ...logistics.appointment_status,
      ...logistics.medication_status,
      ...medication.refill_status
    ].slice(0, 8),
    reasoning_log: reasoningLog,
    clinician_summary: summaries.clinician,
    patient_summary: summaries.patient,
    pharmacist_summary: summaries.pharmacist,
    action_timeline: buildActionTimeline(policyOutput.effective_status),
    conflicts: [],
    missing_fields: [],
    policy_triggers: policyOutput.policy_triggers,
    tool_status: buildToolStatus(mode),
    details: {
      architecture_mode: yamlContext.architectureMode,
      runtime_mode: mode,
      policy_output: policyOutput,
      yaml_sources: yamlContext.files.map((file) => ({ file: file.file, loaded: file.loaded }))
    }
  };

  if (response.key_findings.length === 0) {
    response.key_findings.push("Not available in tool output");
  }
  if (response.appointment_and_medication_facts.length === 0) {
    response.appointment_and_medication_facts.push(MISSING_VALUE);
  }

  const review = reviewerAgent(response);
  response.conflicts = review.conflicts;
  response.missing_fields = review.missingFields;

  return {
    case_id: input.case_id,
    patient_id: input.patient_id,
    patient_name: input.patient_name,
    symptom_report: input.symptom_report,
    scenario,
    mode,
    execution_mode: MODE_LABELS[mode],
    response,
    patient_view: projectPatientView(response, checklist, logistics),
    nurse_view: projectNurseView(response, logistics),
    pharmacist_view: projectPharmacistView(response, medication)
  };
}
