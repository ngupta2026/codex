import { NextResponse } from "next/server";
import { canAccessPatient, recordAuditEvent, recordFeedback } from "@/lib/auth/repository";
import { readCurrentSession } from "@/lib/auth/session";
import { buildDeveloperPrompt, type AIGoal, type DeveloperPromptInput, type FeedbackUserType } from "@/lib/developer-prompts";
import { patients, type Role } from "@/lib/arogyayatra-data";

const roles = new Set<Role>(["home", "admin", "patient", "nurse", "pharmacist", "developer", "feedback"]);
const userTypes = new Set<FeedbackUserType>(["customer", "patient", "nurse", "pharmacist", "admin", "caregiver", "developer"]);
const goals = new Set<AIGoal>([
  "personalized guidance",
  "workflow automation",
  "history summarization",
  "medication support",
  "virtual visit support",
  "care coordination",
  "custom"
]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<DeveloperPromptInput> | null;
  const session = await readCurrentSession();

  if (!body?.feedback?.trim() || !body?.desiredOutcome?.trim()) {
    return NextResponse.json({ error: "feedback and desiredOutcome are required" }, { status: 400 });
  }

  const requestedSourceRole = roles.has(body.sourceRole as Role) ? (body.sourceRole as Role) : "home";
  const sourceRole = !session && requestedSourceRole !== "home" && requestedSourceRole !== "feedback" ? "home" : requestedSourceRole;
  const patientId =
    session && body.patientId && patients.some((patient) => patient.id === body.patientId) && canAccessPatient(session, body.patientId)
      ? body.patientId
      : undefined;

  const input: DeveloperPromptInput = {
    sourceRole,
    patientId,
    userType: userTypes.has(body.userType as FeedbackUserType) ? (body.userType as FeedbackUserType) : "customer",
    aiGoal: goals.has(body.aiGoal as AIGoal) ? (body.aiGoal as AIGoal) : "custom",
    feedback: body.feedback.trim(),
    desiredOutcome: body.desiredOutcome.trim(),
    constraints: body.constraints?.trim() || undefined
  };

  const result = buildDeveloperPrompt(input);

  await recordFeedback({
    userId: session?.userId,
    sourceRole: input.sourceRole,
    patientId: input.patientId,
    userType: input.userType,
    aiGoal: input.aiGoal,
    feedback: input.feedback,
    desiredOutcome: input.desiredOutcome,
    constraints: input.constraints
  });

  await recordAuditEvent({
    actorId: session?.userId,
    actorRole: session?.role ?? "feedback",
    eventType: "feedback_submission",
    summary: `Feedback captured for ${input.sourceRole}.`,
    metadata: {
      sourceRole: input.sourceRole,
      patientId: input.patientId,
      aiGoal: input.aiGoal,
      userType: input.userType
    }
  });

  return NextResponse.json({
    ...result,
    mode: "developer_prompt_generator"
  });
}
