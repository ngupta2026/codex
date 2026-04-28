import type {
  AgentRuntimeRequestEnvelope,
  AgentRuntimeResponseEnvelope,
  AppRole,
  ArchitectureBoundaryContract,
  JourneyStage,
  TraceEventContract,
  UserSessionContract
} from "@/lib/app-foundation";
import { RuntimeMode } from "@/lib/contracts";

export type AgentToolName =
  | "patient_context_agent"
  | "monitoring_agent"
  | "nurse_workload_agent"
  | "pharmacy_agent"
  | "appointment_agent"
  | "virtual_visit_agent"
  | "developer_prompt_agent";

export type AgenticChatRequest = AgentRuntimeRequestEnvelope & {
  role: AppRole;
  patientId: string;
  question: string;
  mode?: RuntimeMode;
  session?: UserSessionContract;
  pageContext?: {
    route: string;
    board: AppRole;
    activeJourneyStage?: JourneyStage;
  };
};

export type AgentFact = {
  label: string;
  value: string;
};

export type AgentTraceStep = {
  step: number;
  agent: string;
  purpose: string;
  status: "completed";
  outputSummary: string;
};

export type AgentToolResult = {
  tool: AgentToolName;
  summary: string;
  facts: AgentFact[];
};

export type AgenticChatResponse = AgentRuntimeResponseEnvelope & {
  answer: string;
  agentsUsed: string[];
  mode: "agentic_coordinator_v1";
  runtimeMode: RuntimeMode;
  role: AppRole;
  patientId: string;
  contextSummary: string;
  escalationRequired: boolean;
  safeNextActions: string[];
  policyTriggers: string[];
  facts: AgentFact[];
  trace: AgentTraceStep[];
  traceEvents: TraceEventContract[];
  decisionBoundaries: ArchitectureBoundaryContract[];
  review: {
    passed: boolean;
    conflicts: string[];
    missingFields: string[];
  };
};
