import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/adminAuth";

/**
 * Next.js 16 "proxy" (formerly middleware). Runs before the real
 * authentication check, purely as a fast first line of defense: if there's
 * no admin_session cookie at all, bounce to /admin/auth immediately.
 *
 * NOTE: proxy runs in a separate runtime/isolate from route handlers and
 * server components, so it must NOT rely on the in-memory session Map from
 * src/lib/adminAuth.ts (that only exists in the Node.js render process).
 * The real, authoritative check — verifying the token is a valid,
 * non-expired session — happens server-side in src/app/admin/page.tsx.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never gate the login page itself, or the API routes it needs.
  if (pathname === "/admin/auth" || pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const hasCookie = request.cookies.has(ADMIN_COOKIE_NAME);
    if (!hasCookie) {
      return NextResponse.redirect(new URL("/admin/auth", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};