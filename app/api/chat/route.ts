import { NextResponse } from "next/server";
import { patients, type Role } from "@/lib/arogyayatra-data";
import { runAgenticChat } from "@/lib/runtime/chat-orchestrator";

const roles = new Set<Role>(["home", "admin", "patient", "nurse", "pharmacist", "developer", "feedback"]);

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

  try {
    return NextResponse.json(runAgenticChat({ role, patientId, question }));
  } catch (error) {
    return NextResponse.json(
      {
        error: "chat orchestration failed",
        details: error instanceof Error ? error.message : "unknown error"
      },
      { status: 500 }
    );
  }
}
