import { NextResponse } from "next/server";
import { readAuthStore } from "@/app/api/auth/_store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ ok: false, message: "Email and password required." }, { status: 400 });
    }

    await readAuthStore();
    const response = NextResponse.json({ ok: true, user: { email } }, { status: 200 });
    response.cookies.set("nunos_auth", "true", {
      httpOnly: true,
      sameSite: "lax",
      path: "/"
    });
    return response;
  } catch {
    return NextResponse.json({ ok: false, message: "Login failed." }, { status: 500 });
  }
}
