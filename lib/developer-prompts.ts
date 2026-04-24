import { agentCapabilities, getPatientById, type Role } from "@/lib/arogyayatra-data";

export type FeedbackUserType = "customer" | "patient" | "nurse" | "pharmacist" | "admin" | "caregiver" | "developer";
export type AIGoal =
  | "personalized guidance"
  | "workflow automation"
  | "history summarization"
  | "medication support"
  | "virtual visit support"
  | "care coordination"
  | "custom";

export type DeveloperPromptInput = {
  sourceRole: Role;
  patientId?: string;
  userType: FeedbackUserType;
  aiGoal: AIGoal;
  feedback: string;
  desiredOutcome: string;
  constraints?: string;
};

function pageSummary(role: Role): string {
  if (role === "home") return "Landing page for role selection, care journey orientation, and current support status.";
  if (role === "admin") return "Operations page for priority patients, nurse workload, pharmacy pressure, appointments, and coordination status.";
  if (role === "patient") return "Patient page for medicines, vitals, appointments, safety guidance, and virtual visit preparation.";
  if (role === "nurse") return "Nurse page for triage queue, active follow-up, and workload management.";
  if (role === "pharmacist") return "Pharmacist page for refill blockers, medication queue, and adherence support.";
  return "Developer page for capturing feedback and generating AI feature prompts.";
}

function safeRole(role: Role): string {
  return role === "developer" ? "developer board" : `${role} page`;
}

export function buildDeveloperPrompt(input: DeveloperPromptInput): { prompt: string; contextSummary: string } {
  const patient = input.patientId ? getPatientById(input.patientId) : null;
  const capabilityList = agentCapabilities.map((agent) => `- ${agent.name}: ${agent.detail}`).join("\n");
  const patientContext = patient
    ? `Patient context:
- Patient: ${patient.name}
- Diagnosis: ${patient.diagnosis}
- Risk: ${patient.risk}
- Current barrier: ${patient.barrier}
- Medication: ${patient.medication}
- Assigned nurse: ${patient.nurse}
- Assigned pharmacist: ${patient.pharmacist}
- Current journey stage: ${patient.journeyStage}`
    : "Patient context:\n- No specific patient selected.";

  const prompt = `You are ChatGPT acting as a senior AI product designer and full-stack implementation advisor for ArogyaYatra, an AI-enabled post-discharge virtual care app.

App context:
- ArogyaYatra supports patients, nurses, pharmacists, admins, and developers.
- The product is patient-centric and focuses on care progression tracking, coordination, virtual consultations, medication continuity, and safe escalation.
- Use healthcare-safe design. Do not suggest autonomous clinical decision-making without deterministic safeguards and human review.

Source page:
- ${safeRole(input.sourceRole)}
- ${pageSummary(input.sourceRole)}

End user requesting improvement:
- ${input.userType}

Requested AI outcome:
- ${input.aiGoal}

Feedback from current app page:
${input.feedback}

Desired outcome:
${input.desiredOutcome}

Constraints:
${input.constraints?.trim() || "- Keep the UI calm, clear, and usable on desktop and mobile.\n- Keep safety-sensitive recommendations deterministic first.\n- Keep the feature customizable for the selected end user persona."}

${patientContext}

Existing AI building blocks in the app:
${capabilityList}

Please produce:
1. The best AI feature idea or feature set customized to the selected end user.
2. The recommended UX changes for the current page.
3. The data inputs, retrieval context, and tool or agent responsibilities needed.
4. A safe prompt or system instruction pattern for the feature.
5. A Next.js-oriented implementation outline with frontend, API, and data-layer changes.
6. Acceptance criteria and edge cases.

Keep the answer practical, implementation-ready, and aligned with ArogyaYatra's visual and workflow style.`;

  return {
    prompt,
    contextSummary: patient
      ? `${input.userType} feedback from ${safeRole(input.sourceRole)} for ${patient.name} (${patient.diagnosis})`
      : `${input.userType} feedback from ${safeRole(input.sourceRole)}`
  };
}
