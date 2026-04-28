import {
  ARCHITECTURE_BOUNDARIES,
  JOURNEY_STAGE_MODEL,
  type AppRole,
  type TraceEventContract
} from "@/lib/app-foundation";
import {
  agentCapabilities,
  patientsForNurse,
  patientsForPharmacist,
  priorityNurses,
  priorityPatients,
  priorityPharmacists
} from "@/lib/arogyayatra-data";
import { buildDeveloperPrompt, type AIGoal, type FeedbackUserType } from "@/lib/developer-prompts";
import { RuntimeMode } from "@/lib/contracts";
import { loadCareContext } from "@/lib/runtime/care-context";
import { type AgentFact, type AgenticChatRequest, type AgenticChatResponse, type AgentToolName, type AgentToolResult, type AgentTraceStep } from "@/lib/runtime/chat-contract";
import { resolveCaseInput } from "@/lib/runtime/orchestrator";

const TOOL_LABELS: Record<AgentToolName, string> = {
  patient_context_agent: "Patient context agent",
  monitoring_agent: "Monitoring agent",
  nurse_workload_agent: "Nurse workload agent",
  pharmacy_agent: "Pharmacy agent",
  appointment_agent: "Appointment agent",
  virtual_visit_agent: "Virtual visit agent",
  developer_prompt_agent: "Developer prompt agent"
};

function dedupeTools(tools: AgentToolName[]): AgentToolName[] {
  return Array.from(new Set(tools));
}

function dedupeFacts(facts: AgentFact[]): AgentFact[] {
  const seen = new Set<string>();
  return facts.filter((fact) => {
    const key = `${fact.label}:${fact.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function inferDeveloperUserType(role: AppRole): FeedbackUserType {
  if (role === "patient") return "patient";
  if (role === "nurse") return "nurse";
  if (role === "pharmacist") return "pharmacist";
  if (role === "admin") return "admin";
  if (role === "developer" || role === "feedback") return "developer";
  return "customer";
}

function inferDeveloperGoal(question: string): AIGoal {
  const q = question.toLowerCase();
  if (/history|summary|earlier/.test(q)) return "history summarization";
  if (/medication|refill|medicine|pickup|insurance/.test(q)) return "medication support";
  if (/visit|camera|audio|virtual/.test(q)) return "virtual visit support";
  if (/workflow|automation|queue|load/.test(q)) return "workflow automation";
  if (/care|coordination|priority|handoff/.test(q)) return "care coordination";
  if (/guide|coach|help me understand/.test(q)) return "personalized guidance";
  return "custom";
}

function selectTools(role: AppRole, question: string): AgentToolName[] {
  const q = question.toLowerCase();
  const tools: AgentToolName[] = [];

  if (/history|earlier|journey|assigned|care team|context/.test(q)) tools.push("patient_context_agent");
  if (/priority|critical|review|first|risk|escalat|blocker|status/.test(q)) tools.push("monitoring_agent");
  if (/nurse|load|queue|workload|handling|patients/.test(q)) tools.push("nurse_workload_agent");
  if (/pharmac|refill|fill|medicine|pickup|insurance|medication continuity/.test(q)) tools.push("pharmacy_agent");
  if (/appointment|calendar|schedule|visit|when|today/.test(q)) tools.push("appointment_agent");
  if (/camera|audio|zoom|video|pre-call|virtual/.test(q)) tools.push("virtual_visit_agent");
  if (role === "developer" || role === "feedback" || /developer|feature|feedback|prompt|ai/.test(q)) tools.push("developer_prompt_agent");

  if (tools.length === 0) {
    if (role === "patient") return ["patient_context_agent", "appointment_agent", "monitoring_agent"];
    if (role === "nurse") return ["monitoring_agent", "nurse_workload_agent", "appointment_agent"];
    if (role === "pharmacist") return ["pharmacy_agent", "patient_context_agent"];
    if (role === "admin") return ["monitoring_agent", "nurse_workload_agent", "pharmacy_agent"];
    if (role === "developer" || role === "feedback") return ["developer_prompt_agent", "monitoring_agent"];
    return ["patient_context_agent", "appointment_agent"];
  }

  return dedupeTools(tools);
}

function runTool(tool: AgentToolName, role: AppRole, question: string, resolved: ReturnType<typeof resolveCaseInput>) {
  const context = loadCareContext(role, resolved.input.patient_id);

  switch (tool) {
    case "patient_context_agent":
      return {
        tool,
        summary: `${context.patient.name} is in ${context.patient.journeyStage.toLowerCase()} with ${context.patient.diagnosis.toLowerCase()} and is assigned to nurse ${context.patient.nurse} and pharmacist ${context.patient.pharmacist}.`,
        facts: [
          { label: "Patient", value: `${context.patient.name} (${context.patient.id})` },
          { label: "Diagnosis", value: context.patient.diagnosis },
          { label: "Journey stage", value: context.patient.journeyStage },
          { label: "Medication", value: context.patient.medication },
          { label: "Care team", value: `${context.patient.nurse} and ${context.patient.pharmacist}` },
          { label: "Recent history", value: context.patient.history[context.patient.history.length - 1] }
        ]
      } satisfies AgentToolResult;
    case "monitoring_agent":
      return {
        tool,
        summary: `${context.patient.name} is currently ${resolved.response.risk_status.replaceAll("_", " ")} with ${resolved.response.escalation_required ? "an active escalation requirement" : "no immediate escalation flag"}.`,
        facts: [
          { label: "Risk", value: context.patient.risk },
          { label: "Runtime risk", value: resolved.response.risk_status.replaceAll("_", " ") },
          { label: "Escalation", value: resolved.response.escalation_required ? "Required" : "Not required" },
          { label: "Current blocker", value: context.patient.barrier },
          { label: "Discharge age", value: `${context.patient.dischargeHoursAgo} hours since discharge` },
          { label: "Policy triggers", value: resolved.response.policy_triggers.join(", ") }
        ]
      } satisfies AgentToolResult;
    case "nurse_workload_agent": {
      const rankedNurses = priorityNurses().slice(0, 3);
      const assignedLoad = context.assignedNurse ? patientsForNurse(context.assignedNurse.name).length : 0;
      return {
        tool,
        summary: context.assignedNurse
          ? `${context.assignedNurse.name} is handling ${assignedLoad} active patient(s) on shift ${context.assignedNurse.shift}. ${rankedNurses[0]?.name} is the highest current workload priority.`
          : "No assigned nurse was found for this patient context.",
        facts: [
          { label: "Assigned nurse", value: context.assignedNurse ? context.assignedNurse.name : "Not assigned" },
          { label: "Assigned load", value: `${assignedLoad} active patient(s)` },
          { label: "Shift", value: context.assignedNurse ? context.assignedNurse.shift : "Unknown" },
          { label: "Top nurse queue", value: rankedNurses.map((nurse) => `${nurse.name}: ${patientsForNurse(nurse.name).length}`).join(" | ") }
        ]
      } satisfies AgentToolResult;
    }
    case "pharmacy_agent": {
      const rankedPharmacists = priorityPharmacists().slice(0, 3);
      const linkedPatients = context.assignedPharmacist ? patientsForPharmacist(context.assignedPharmacist.name).length : 0;
      return {
        tool,
        summary: context.assignedPharmacist
          ? `${context.assignedPharmacist.name} has ${context.assignedPharmacist.fillsToday} fills today, ${context.assignedPharmacist.queueSize} open queue item(s), and ${linkedPatients} linked patient(s).`
          : "No assigned pharmacist was found for this patient context.",
        facts: [
          { label: "Assigned pharmacist", value: context.assignedPharmacist ? context.assignedPharmacist.name : "Not assigned" },
          { label: "Refill status", value: context.patient.refillStatus },
          { label: "Fills today", value: context.assignedPharmacist ? String(context.assignedPharmacist.fillsToday) : "0" },
          { label: "Open pharmacy queue", value: context.assignedPharmacist ? String(context.assignedPharmacist.queueSize) : "0" },
          { label: "Top pharmacy queue", value: rankedPharmacists.map((pharmacist) => `${pharmacist.name}: ${pharmacist.fillsToday} fills`).join(" | ") }
        ]
      } satisfies AgentToolResult;
    }
    case "appointment_agent":
      return {
        tool,
        summary: `${context.patient.name} is scheduled for ${context.patient.appointment}. The next coordination action is ${context.patient.nextAction}.`,
        facts: [
          { label: "Appointment", value: context.patient.appointment },
          { label: "Next action", value: context.patient.nextAction },
          { label: "Messages", value: `${context.patient.messages} unread coordination message(s)` },
          { label: "Page context", value: context.pageSummary }
        ]
      } satisfies AgentToolResult;
    case "virtual_visit_agent":
      return {
        tool,
        summary: `Virtual visit prep is ready for ${context.patient.name}. The pre-call flow should verify camera, audio, and appointment readiness before joining.`,
        facts: [
          { label: "Visit readiness", value: resolved.response.escalation_required ? "Priority pre-call check" : "Standard pre-call check" },
          { label: "Camera check", value: "Preview before connect" },
          { label: "Audio check", value: "Microphone confirmation required" },
          { label: "Next visit", value: context.patient.appointment }
        ]
      } satisfies AgentToolResult;
    case "developer_prompt_agent": {
      const generated = buildDeveloperPrompt({
        sourceRole: role,
        patientId: context.patient.id,
        userType: inferDeveloperUserType(role),
        aiGoal: inferDeveloperGoal(question),
        feedback: question,
        desiredOutcome: "Generate a safe, page-specific AI feature plan for ArogyaYatra.",
        constraints:
          "Keep the feature deterministic-first, auditable, customizable by role, and compatible with the current Next.js app."
      });

      return {
        tool,
        summary: `Developer flow is ready to convert page feedback into a ChatGPT-ready feature brief. Context summary: ${generated.contextSummary}.`,
        facts: [
          { label: "Developer context", value: generated.contextSummary },
          { label: "AI goal", value: inferDeveloperGoal(question) },
          { label: "Feature blocks", value: agentCapabilities.map((entry) => entry.name).join(", ") }
        ]
      } satisfies AgentToolResult;
    }
  }
}

function buildTrace(role: AppRole, question: string, toolResults: AgentToolResult[], contextSummary: string, reviewPassed: boolean, escalationRequired: boolean): AgentTraceStep[] {
  const steps: AgentTraceStep[] = [
    {
      step: 1,
      agent: "Context loader",
      purpose: "Load page state, patient context, care team links, and runtime case input.",
      status: "completed",
      outputSummary: contextSummary
    },
    {
      step: 2,
      agent: "Coordinator agent",
      purpose: "Select the specialist tools needed for the current role and question.",
      status: "completed",
      outputSummary: `Selected ${toolResults.map((result) => TOOL_LABELS[result.tool]).join(", ")} for ${role} question: ${question}`
    }
  ];

  toolResults.forEach((result, index) => {
    steps.push({
      step: index + 3,
      agent: TOOL_LABELS[result.tool],
      purpose: "Collect structured facts for answer synthesis.",
      status: "completed",
      outputSummary: result.summary
    });
  });

  steps.push({
    step: toolResults.length + 3,
    agent: "Reviewer agent",
    purpose: "Apply deterministic safety review and surface escalation state.",
    status: "completed",
    outputSummary: `${reviewPassed ? "Review passed" : "Review flagged issues"}; escalation ${escalationRequired ? "required" : "not required"}.`
  });

  return steps;
}

function buildAnswer(role: AppRole, question: string, toolResults: AgentToolResult[], resolved: ReturnType<typeof resolveCaseInput>): string {
  const q = question.toLowerCase();
  const context = loadCareContext(role, resolved.input.patient_id);

  if (/history|earlier|heart failure|medication history/.test(q)) {
    return context.patient.history.join(" ");
  }

  if (/priority|critical|review|first/.test(q)) {
    const top = priorityPatients()[0];
    return `${top.name} is the highest current priority because of ${top.risk.toLowerCase()} status, ${top.dischargeHoursAgo} hours since discharge, and blocker: ${top.barrier}. Recommended next action: ${top.nextAction}.`;
  }

  if (/nurse|load|queue|workload|handling/.test(q)) {
    return priorityNurses()
      .slice(0, 3)
      .map((nurse) => `${nurse.name} is handling ${patientsForNurse(nurse.name).length} patient(s) with ${nurse.responseMinutes} minute response time on shift ${nurse.shift}.`)
      .join(" ");
  }

  if (/pharmac|refill|fill|pickup|insurance|medicine/.test(q)) {
    return priorityPharmacists()
      .slice(0, 3)
      .map((pharmacist) => `${pharmacist.name} has ${pharmacist.fillsToday} fills today, ${pharmacist.queueSize} open queue item(s), and ${patientsForPharmacist(pharmacist.name).length} linked patient(s).`)
      .join(" ");
  }

  if (/appointment|calendar|visit|when/.test(q)) {
    return `${context.patient.name} is scheduled for ${context.patient.appointment}. The current coordination action is ${context.patient.nextAction}.`;
  }

  if (role === "developer" || role === "feedback" || /feature|feedback|prompt|ai/.test(q)) {
    return `The AI Enabled Feedback flow should capture page feedback, selected persona, and desired AI outcome, then route that into a structured prompt and audited coordinator workflow. Start from the AI Enabled Feedback board or the /api/developer-prompt route for prompt generation.`;
  }

  if (role === "patient") {
    return `${resolved.patient_view.patient_summary} Medication: ${context.patient.medication}. Refill status: ${context.patient.refillStatus}.`;
  }

  if (role === "nurse") {
    return `${resolved.nurse_view.triage_summary} Same-day actions: ${resolved.nurse_view.same_day_follow_up_actions.join(" ")}`;
  }

  if (role === "pharmacist") {
    return `${resolved.pharmacist_view.pharmacist_summary} Action queue: ${resolved.pharmacist_view.medication_action_queue.join(" ")}`;
  }

  return toolResults.map((result) => result.summary).join(" ");
}

function buildTraceEvents(role: AppRole, trace: AgentTraceStep[]): TraceEventContract[] {
  return trace.map((step) => ({
    traceId: `trace-${role}-${String(step.step).padStart(2, "0")}`,
    timestamp: new Date().toISOString(),
    role,
    type:
      step.agent === "Context loader"
        ? "context_loaded"
        : step.agent === "Coordinator agent"
          ? "route_selected"
          : step.agent === "Reviewer agent"
            ? "review_completed"
            : "tool_called",
    actor: step.agent,
    summary: step.outputSummary
  }));
}

export function runAgenticChat(request: AgenticChatRequest): AgenticChatResponse {
  const runtimeMode: RuntimeMode = request.mode ?? "local_deterministic";
  const context = loadCareContext(request.role, request.patientId);
  const resolved = resolveCaseInput(context.caseInput, runtimeMode);
  const selectedTools = selectTools(request.role, request.question);
  const toolResults = selectedTools.map((tool) => runTool(tool, request.role, request.question, resolved));
  const answer = buildAnswer(request.role, request.question, toolResults, resolved);
  const facts = dedupeFacts(toolResults.flatMap((result) => result.facts)).slice(0, 10);
  const contextSummary = `${context.pageSummary} Active patient context: ${context.patient.name} (${context.patient.id}) with ${context.patient.risk.toLowerCase()} status.`;
  const review = {
    passed: resolved.response.conflicts.length === 0,
    conflicts: resolved.response.conflicts,
    missingFields: resolved.response.missing_fields
  };
  const agentsUsed = [...toolResults.map((result) => TOOL_LABELS[result.tool]), "Coordinator agent", "Reviewer agent"];
  const trace = buildTrace(request.role, request.question, toolResults, contextSummary, review.passed, resolved.response.escalation_required);

  return {
    answer,
    agentsUsed,
    mode: "agentic_coordinator_v1",
    runtimeMode,
    role: request.role,
    patientId: context.patient.id,
    contextSummary,
    escalationRequired: resolved.response.escalation_required,
    safeNextActions: resolved.response.action_timeline.immediate.slice(0, 3),
    policyTriggers: resolved.response.policy_triggers,
    facts,
    trace,
    traceEvents: buildTraceEvents(request.role, trace),
    decisionBoundaries: [...ARCHITECTURE_BOUNDARIES],
    journeyModel: JOURNEY_STAGE_MODEL,
    review
  };
}
