import { NextResponse } from "next/server";
import { answerCareQuestion, patients, type Role } from "@/lib/arogyayatra-data";

const roles = new Set<Role>(["home", "admin", "patient", "nurse", "pharmacist", "developer"]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { role?: string; patientId?: string; question?: string }
    | null;

  const role = roles.has(body?.role as Role) ? (body?.role as Role) : "home";
  const patientId = body?.patientId && patients.some((patient) => patient.id === body.patientId) ? body.patientId : patients[0].id;
  const question = body?.question?.trim();

  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  const response = answerCareQuestion(role, patientId, question);

  return NextResponse.json({
    ...response,
    role,
    patientId,
    mode: "deterministic_agent_ready"
  });
}
