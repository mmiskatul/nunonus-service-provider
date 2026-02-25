import { NextResponse } from "next/server";
import { readAuthStore, writeAuthStore } from "@/app/api/auth/_store";

function generateCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ ok: false, message: "Email required." }, { status: 400 });
    }

    const store = await readAuthStore();
    const userExists = store.users.some((user) => user.email.toLowerCase() === email);

    if (!userExists) {
      return NextResponse.json({ ok: false, message: "Account not found." }, { status: 404 });
    }

    const code = generateCode();
    store.resetCodes[email] = { code, issuedAt: new Date().toISOString() };
    await writeAuthStore(store);

    return NextResponse.json({ ok: true, message: "OTP sent to email.", code }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, message: "Unable to start reset flow." }, { status: 500 });
  }
}
