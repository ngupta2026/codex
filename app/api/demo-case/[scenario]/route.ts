import { NextResponse } from "next/server";
import { getDemoCase } from "@/lib/demo-data";

export async function GET(request: Request, { params }: { params: Promise<{ scenario: string }> }) {
  const { scenario } = await params;
  const mode = new URL(request.url).searchParams.get("mode") ?? undefined;
  const payload = getDemoCase(scenario, mode);
  return NextResponse.json(payload);
}
