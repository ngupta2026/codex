import { NextResponse } from "next/server";
import { recordAuditEvent, recordTrace, resolvePatientIdForSession } from "@/lib/auth/repository";
import { readCurrentSession } from "@/lib/auth/session";
import { runAgenticChat } from "@/lib/runtime/chat-orchestrator";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { patientId?: string; question?: string }
    | null;
  const question = body?.question?.trim();

  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  const session = await readCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "authentication required" }, { status: 401 });
  }

  if (session.role === "developer") {
    return NextResponse.json({ error: "developer access is limited to observability and review tools" }, { status: 403 });
  }

  const patientId = resolvePatientIdForSession(session, body?.patientId);
  if (!patientId) {
    return NextResponse.json({ error: "no authorized patient context is available for this session" }, { status: 403 });
  }

  try {
    const response = runAgenticChat({
      role: session.role,
      patientId,
      question,
      session,
      pageContext: {
        route: `/api/chat`,
        board: session.role
      }
    });

    await recordTrace({
      userId: session.userId,
      role: session.role,
      patientId,
      runtimeMode: response.runtimeMode,
      question,
      answerSummary: response.answer,
      toolCalls: response.trace
        .filter((step) => !["Context loader", "Coordinator agent", "Reviewer agent"].includes(step.agent))
        .map((step) => ({ toolName: step.agent, summary: step.outputSummary })),
      policyEvents: response.policyTriggers.map((trigger) => ({
        trigger,
        summary: `Policy trigger raised during ${session.role} coordination flow.`
      }))
    });

    await recordAuditEvent({
      actorId: session.userId,
      actorRole: session.role,
      eventType: "chat_request",
      summary: `Agentic chat executed for ${session.role}.`,
      metadata: { patientId, question }
    });

    return NextResponse.json(response);
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
