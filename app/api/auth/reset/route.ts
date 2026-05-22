import { NextResponse } from "next/server";

function getBackendBaseUrl() {
  const value = process.env.NEXT_PUBLIC_AUTH_API_BASE?.trim();
  if (!value) {
    throw new Error("NEXT_PUBLIC_AUTH_API_BASE is not configured.");
  }
  return value.replace(/\/+$/, "");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = String(body?.password ?? "");
    const resetToken = request.headers.get("cookie")
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("nunos_dashboard_reset_token="))
      ?.split("=")[1];

    if (!password) {
      return NextResponse.json({ ok: false, message: "Password required." }, { status: 400 });
    }
    if (!resetToken) {
      return NextResponse.json({ ok: false, message: "Verification required." }, { status: 401 });
    }

    const response = await fetch(`${getBackendBaseUrl()}/api/v1/dashboard/auth/forgot-password/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reset_token: decodeURIComponent(resetToken), new_password: password }),
      cache: "no-store"
    });
    const payload = (await response.json().catch(() => ({}))) as { detail?: string; message?: string };
    if (!response.ok) {
      return NextResponse.json(
        { ok: false, message: payload.detail ?? payload.message ?? "Reset failed." },
        { status: response.status || 500 }
      );
    }

    const nextResponse = NextResponse.json({ ok: true }, { status: 200 });
    nextResponse.cookies.set("nunos_dashboard_reset_token", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0
    });
    return nextResponse;
  } catch {
    return NextResponse.json({ ok: false, message: "Reset failed." }, { status: 500 });
  }
}
