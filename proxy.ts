import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = [
  "/login",
  "/auth/login",
  "/register",
  "/auth/register",
  "/registration-submitted",
  "/auth/registration-submitted",
  "/forgot-password",
  "/auth/forgot-password",
  "/verify-code",
  "/auth/verify-code",
  "/auth/verify-otp",
  "/reset-password",
  "/auth/reset-password",
  "/password-changed",
  "/auth/password-changed",
  "/legal",
  "/auth/legal"
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const hasAuth = request.cookies.get("nunos_vendor_auth")?.value === "true";
  if (!hasAuth) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
