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

    const store = await readAuthStore();
    const matched = store.users.find((user) => user.email.toLowerCase() === email && user.password === password);

    if (!matched) {
      return NextResponse.json({ ok: false, message: "Invalid email or password." }, { status: 401 });
    }

    return NextResponse.json({ ok: true, user: { email: matched.email } }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, message: "Login failed." }, { status: 500 });
  }
}
