import { MISSING_VALUE, ResponseContract, RuntimeMode, ToolState } from "@/lib/contracts";

const REQUIRED_LIST_FIELDS: Array<keyof ResponseContract> = [
  "key_findings",
  "immediate_actions",
  "appointment_and_medication_facts",
  "reasoning_log",
  "policy_triggers"
];

export function buildToolStatus(mode: RuntimeMode): Record<string, ToolState> {
  const statusByMode: ToolState =
    mode === "local_deterministic"
      ? "success"
      : mode === "live_tools_mode"
        ? "simulated_live_tool"
        : "simulated_orchestrate_api";

  return {
    translator_agent: statusByMode,
    monitoring_agent: statusByMode,
    logistics_agent: statusByMode,
    medication_agent: statusByMode,
    orchestrator_agent: statusByMode,
    reviewer_agent: "success"
  };
}

export function reviewerAgent(response: ResponseContract): { conflicts: string[]; missingFields: string[] } {
  const conflicts: string[] = [];
  const missingFields: string[] = [];

  for (const key of REQUIRED_LIST_FIELDS) {
    const value = response[key];
    if (!Array.isArray(value) || value.length === 0) {
      missingFields.push(String(key));
      continue;
    }
    if (value.some((entry) => entry === MISSING_VALUE)) {
      missingFields.push(String(key));
    }
  }

  if (response.risk_status === "high_priority_health_shift" && !response.escalation_required) {
    conflicts.push("High-priority risk without escalation_required=true.");
  }
  if (response.risk_status === "routine" && response.escalation_required) {
    conflicts.push("Routine risk should not escalate unless overridden by policy.");
  }

  return {
    conflicts,
    missingFields
  };
}
