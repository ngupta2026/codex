import { NextResponse } from "next/server";
import { buildDeveloperPrompt, type AIGoal, type DeveloperPromptInput, type FeedbackUserType } from "@/lib/developer-prompts";
import { patients, type Role } from "@/lib/arogyayatra-data";

const roles = new Set<Role>(["home", "admin", "patient", "nurse", "pharmacist", "developer"]);
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

  if (!body?.feedback?.trim() || !body?.desiredOutcome?.trim()) {
    return NextResponse.json({ error: "feedback and desiredOutcome are required" }, { status: 400 });
  }

  const input: DeveloperPromptInput = {
    sourceRole: roles.has(body.sourceRole as Role) ? (body.sourceRole as Role) : "home",
    patientId: body.patientId && patients.some((patient) => patient.id === body.patientId) ? body.patientId : undefined,
    userType: userTypes.has(body.userType as FeedbackUserType) ? (body.userType as FeedbackUserType) : "customer",
    aiGoal: goals.has(body.aiGoal as AIGoal) ? (body.aiGoal as AIGoal) : "custom",
    feedback: body.feedback.trim(),
    desiredOutcome: body.desiredOutcome.trim(),
    constraints: body.constraints?.trim() || undefined
  };

  const result = buildDeveloperPrompt(input);

  return NextResponse.json({
    ...result,
    mode: "developer_prompt_generator"
  });
}
