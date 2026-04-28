import { NextResponse } from "next/server";
import { roleHomePath } from "@/lib/auth/repository";
import { readCurrentSession } from "@/lib/auth/session";

export async function GET() {
  const session = await readCurrentSession();

  return NextResponse.json({
    authenticated: Boolean(session),
    session,
    homePath: session ? roleHomePath(session) : "/"
  });
}
