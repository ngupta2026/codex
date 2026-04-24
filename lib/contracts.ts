export const MISSING_VALUE = "Not available in tool output" as const;

export type MissingValue = typeof MISSING_VALUE;
export type Scenario = "routine" | "watch_closely" | "high_priority_health_shift";
export type RiskStatus = Scenario;
export type RuntimeMode = "local_deterministic" | "live_tools_mode" | "orchestrate_rest_api";

export type ActionTimeline = {
  immediate: string[];
  same_day: string[];
  next_24h: string[];
};

export type ToolState =
  | "success"
  | "simulated_live_tool"
  | "simulated_orchestrate_api"
  | "fallback_local_deterministic";

export type CaseInput = {
  case_id: string;
  patient_id: string;
  patient_name: string;
  symptom_report: string;
  vitals_snapshot?: {
    oxygen_saturation_pct?: number;
    heart_rate_bpm?: number;
    temperature_f?: number;
  };
  discharge_instructions?: string[];
  medication_status?: {
    current_medications?: string[];
    refill_state?: string[];
    adherence_barriers?: string[];
    pickup_or_delivery_issues?: string[];
  };
  appointments?: {
    scheduled?: string[];
    pending?: string[];
    missed?: string[];
  };
  transport_access?: {
    status?: string;
    constraints?: string[];
  };
  pharmacy_refill_status?: {
    status?: string;
    notes?: string[];
  };
};

export type DischargeChecklist = {
  daily_checklist: string[];
  medication_schedule: string[];
  safety_tips: string[];
};

export type RiskAssessment = {
  triage_level: RiskStatus;
  concerning_signals: string[];
  recommended_action: string;
  escalate_to_nurse: boolean;
};

export type CoordinationPlan = {
  medication_status: string[];
  appointment_status: string[];
  resolved_actions: string[];
  barriers: string[];
};

export type MedicationAssessment = {
  medication_reconciliation: string[];
  refill_status: string[];
  adherence_barriers: string[];
  issue_flags: string[];
  delivery_pickup_issues: string[];
  patient_contact_status: string;
  medication_action_queue: string[];
};

export type PolicyOutput = {
  effective_status: RiskStatus;
  escalated: boolean;
  policy_notes: string[];
  policy_triggers: string[];
};

export type ResponseContract = {
  risk_status: RiskStatus;
  escalation_required: boolean;
  key_findings: string[];
  immediate_actions: string[];
  appointment_and_medication_facts: string[];
  reasoning_log: string[];
  clinician_summary: string;
  patient_summary: string;
  pharmacist_summary: string;
  action_timeline: ActionTimeline;
  conflicts: string[];
  missing_fields: string[];
  policy_triggers: string[];
  tool_status: Record<string, ToolState>;
  details: {
    architecture_mode: string;
    runtime_mode: RuntimeMode;
    policy_output: PolicyOutput;
    yaml_sources: Array<{ file: string; loaded: boolean }>;
  };
};

export type PatientView = {
  role: "patient";
  what_to_do_now: string[];
  today_checklist: string[];
  medication_reminders: string[];
  appointment_reminders: string[];
  symptom_watch_list: string[];
  when_to_call_for_help: string;
  patient_summary: string;
};

export type NurseView = {
  role: "nurse";
  risk_banner: string;
  triage_summary: string;
  vitals_or_signals: string[];
  unresolved_logistics_blockers: string[];
  same_day_follow_up_actions: string[];
  escalation_required: boolean;
  policy_triggers: string[];
  task_queue: string[];
  reasoning_log: string[];
  clinician_summary: string;
};

export type PharmacistView = {
  role: "pharmacist";
  medication_reconciliation: string[];
  refill_status: string[];
  adherence_barriers: string[];
  issue_flags: string[];
  delivery_pickup_issues: string[];
  patient_contact_status: string;
  medication_action_queue: string[];
  unavailable_data: string[];
  pharmacist_summary: string;
};

export type DemoCase = {
  case_id: string;
  patient_id: string;
  patient_name: string;
  symptom_report: string;
  scenario: Scenario;
  mode: RuntimeMode;
  execution_mode: "Local deterministic" | "Live watsonx tools" | "Orchestrate REST API";
  response: ResponseContract;
  patient_view: PatientView;
  nurse_view: NurseView;
  pharmacist_view: PharmacistView;
};
