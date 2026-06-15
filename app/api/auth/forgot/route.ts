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
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ ok: false, message: "Email required." }, { status: 400 });
    }

    const response = await fetch(`${getBackendBaseUrl()}/api/v1/platform-admin/auth/forgot-password/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_or_phone: email }),
      cache: "no-store"
    });
    const payload = (await response.json().catch(() => ({}))) as { detail?: string; message?: string };
    if (!response.ok) {
      return NextResponse.json(
        { ok: false, message: payload.detail ?? payload.message ?? "Unable to send code." },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json({ ok: true, message: "OTP sent to email." }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, message: "Unable to start reset flow." }, { status: 500 });
  }
}
