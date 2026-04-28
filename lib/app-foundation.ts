export const APP_ROLE_MODEL = ["home", "admin", "patient", "nurse", "pharmacist", "developer", "feedback"] as const;
export type AppRole = (typeof APP_ROLE_MODEL)[number];

export const JOURNEY_STAGE_MODEL = ["Intake", "Assessment", "Treatment", "Monitoring", "Recovery"] as const;
export type JourneyStage = (typeof JOURNEY_STAGE_MODEL)[number];

export type AuthenticatedAppRole = Exclude<AppRole, "home" | "feedback">;

export type AccessScopeKind =
  | "public_home"
  | "operational_admin"
  | "patient_self"
  | "nurse_assignments"
  | "pharmacy_queue"
  | "developer_observability"
  | "feedback_workspace";

export type AccessScopeContract = {
  kind: AccessScopeKind;
  summary: string;
  entityIds?: string[];
};

export type UserSessionContract = {
  sessionId: string;
  userId: string;
  role: AuthenticatedAppRole;
  displayName: string;
  linkedEntityId?: string;
  authenticated: boolean;
  issuedAt: string;
  scope: AccessScopeContract;
};

export type PatientContextContract = {
  patientId: string;
  patientName: string;
  diagnosis: string;
  riskLabel: string;
  currentJourneyStage: JourneyStage;
  currentBarrier: string;
  medication: string;
  appointment: string;
  assignedNurse: string;
  assignedPharmacist: string;
  source: "seeded_demo_data" | "database_record" | "retrieved_context";
};

export type JourneyStageStatus = "completed" | "current_focus" | "attention" | "upcoming";
export type JourneyStageMap<T> = Record<JourneyStage, T>;

export type JourneyStateSource = "seeded_demo_data" | "agent_recommendation" | "policy_validated" | "manual_override";
export type JourneyStateAuthority = "system_seed" | "coordinator_agent" | "policy_engine" | "human_reviewer";

export type JourneyStateContract = {
  currentStage: JourneyStage;
  stageStatuses: JourneyStageMap<JourneyStageStatus>;
  source: JourneyStateSource;
  authority: JourneyStateAuthority;
  rationale: string[];
};

export type DecisionBoundaryKind = "deterministic_policy" | "agent_recommendation" | "ui_display_state";

export type ArchitectureBoundaryContract = {
  kind: DecisionBoundaryKind;
  owner: string;
  summary: string;
  canWriteJourneyState: boolean;
  requiresHumanApproval: boolean;
};

export const ARCHITECTURE_BOUNDARIES: ArchitectureBoundaryContract[] = [
  {
    kind: "deterministic_policy",
    owner: "Policy engine",
    summary: "Final safety, escalation, and journey-state validation must pass through deterministic policy before the system persists or acts.",
    canWriteJourneyState: true,
    requiresHumanApproval: false
  },
  {
    kind: "agent_recommendation",
    owner: "Coordinator and specialist agents",
    summary: "Agents can recommend actions, priorities, and journey-state changes but do not finalize them independently.",
    canWriteJourneyState: false,
    requiresHumanApproval: false
  },
  {
    kind: "ui_display_state",
    owner: "Dashboard and presentation layer",
    summary: "UI components can shape how information is displayed but cannot override care logic, patient scope, or policy outcomes.",
    canWriteJourneyState: false,
    requiresHumanApproval: false
  }
] as const;

export type AgentRuntimePageContext = {
  route: string;
  board: AppRole;
  activeJourneyStage?: JourneyStage;
};

export type AgentRuntimeRequestEnvelope = {
  role: AppRole;
  patientId?: string;
  question: string;
  session?: UserSessionContract;
  pageContext?: AgentRuntimePageContext;
};

export type AgentRuntimeResponseEnvelope = {
  decisionBoundaries: ArchitectureBoundaryContract[];
  journeyModel: readonly JourneyStage[];
};

export type TraceEventType =
  | "context_loaded"
  | "route_selected"
  | "tool_called"
  | "policy_evaluated"
  | "review_completed"
  | "response_returned";

export type TraceEventContract = {
  traceId: string;
  timestamp: string;
  role: AppRole;
  type: TraceEventType;
  actor: string;
  summary: string;
};

export type AuditEventType =
  | "auth_access"
  | "chat_request"
  | "journey_state_update"
  | "feedback_submission"
  | "preview_requested"
  | "reversion_requested";

export type AuditEventContract = {
  auditId: string;
  timestamp: string;
  actorRole: AppRole;
  actorId?: string;
  eventType: AuditEventType;
  summary: string;
};

export function isAppRole(value: string): value is AppRole {
  return (APP_ROLE_MODEL as readonly string[]).includes(value);
}

export function isJourneyStage(value: string): value is JourneyStage {
  return (JOURNEY_STAGE_MODEL as readonly string[]).includes(value);
}
