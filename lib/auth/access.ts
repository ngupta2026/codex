import type { NextRequest } from "next/server";
import type { AuthenticatedAppRole } from "@/lib/app-foundation";
import type { AuthenticatedSession } from "@/lib/auth/repository";

export const PROTECTED_ROLE_ROUTES: Record<AuthenticatedAppRole, string> = {
  admin: "/admin",
  developer: "/developer",
  nurse: "/nurse",
  patient: "/patient",
  pharmacist: "/pharmacist"
};

export function isProtectedRoute(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/patient/") || pathname === "/nurse" || pathname === "/pharmacist" || pathname === "/developer";
}

export function canVisitPathname(session: Pick<AuthenticatedSession, "role" | "linkedEntityId">, pathname: string): boolean {
  if (pathname === "/admin") return session.role === "admin";
  if (pathname === "/developer") return session.role === "developer";
  if (pathname === "/nurse") return session.role === "nurse";
  if (pathname === "/pharmacist") return session.role === "pharmacist";
  if (pathname.startsWith("/patient/")) {
    return session.role === "patient" && pathname === `/patient/${session.linkedEntityId}`;
  }
  return true;
}

export function redirectPathForSession(session: Pick<AuthenticatedSession, "role" | "linkedEntityId">): string {
  if (session.role === "admin") return "/admin";
  if (session.role === "developer") return "/developer";
  if (session.role === "nurse") return "/nurse";
  if (session.role === "pharmacist") return "/pharmacist";
  return `/patient/${session.linkedEntityId ?? "PT-1001"}`;
}

export function requestedPatientId(pathname: string): string | undefined {
  const match = pathname.match(/^\/patient\/([^/]+)$/);
  return match?.[1];
}

export function buildAuthRedirect(request: NextRequest): URL {
  const redirectUrl = new URL("/", request.url);
  redirectUrl.searchParams.set("auth", "required");
  redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
  return redirectUrl;
}
