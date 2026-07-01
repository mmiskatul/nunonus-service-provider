import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle redirects from /auth/ paths to root auth paths
  if (pathname === "/auth/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname === "/auth/register") {
    return NextResponse.redirect(new URL("/register", request.url));
  }
  if (pathname === "/auth/forgot-password") {
    return NextResponse.redirect(new URL("/forgot-password", request.url));
  }
  if (pathname === "/auth/reset-password") {
    return NextResponse.redirect(new URL("/reset-password", request.url));
  }
  if (pathname === "/auth/verify-code" || pathname === "/auth/verify-otp") {
    return NextResponse.redirect(new URL("/verify-code", request.url));
  }

  // Session checks for vendor login state
  const hasAuth = request.cookies.get("nunos_vendor_auth")?.value === "true";
  const isPublicPath = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-code",
    "/registration-submitted",
  ].some((path) => pathname.startsWith(path));

  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  if (!hasAuth && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
