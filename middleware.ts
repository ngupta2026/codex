import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { buildAuthRedirect, canVisitPathname, isProtectedRoute, redirectPathForSession } from "@/lib/auth/access";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(buildAuthRedirect(request));
  }

  const claims = await verifySessionToken(token);
  if (!claims) {
    const response = NextResponse.redirect(buildAuthRedirect(request));
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  if (!canVisitPathname({ role: claims.role, linkedEntityId: claims.linkedEntityId }, pathname)) {
    return NextResponse.redirect(new URL(redirectPathForSession({ role: claims.role, linkedEntityId: claims.linkedEntityId }), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/patient/:path*", "/nurse", "/pharmacist", "/developer"]
};
