import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = [
  "/auth/login",
  "/auth/register",
  "/auth/registration-submitted",
  "/auth/forgot-password",
  "/auth/verify-code",
  "/auth/verify-otp",
  "/auth/reset-password",
  "/auth/password-changed",
  "/auth/legal"
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect legacy root auth routes to nested /auth/ routes
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
  if (pathname === "/register") {
    return NextResponse.redirect(new URL("/auth/register", request.url));
  }
  if (pathname === "/forgot-password") {
    return NextResponse.redirect(new URL("/auth/forgot-password", request.url));
  }
  if (pathname === "/reset-password") {
    return NextResponse.redirect(new URL("/auth/reset-password", request.url));
  }
  if (pathname === "/verify-code" || pathname === "/auth/verify-code") {
    return NextResponse.redirect(new URL("/auth/verify-otp", request.url));
  }

  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const hasAuth = request.cookies.get("nunos_vendor_auth")?.value === "true";
  if (!hasAuth) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
