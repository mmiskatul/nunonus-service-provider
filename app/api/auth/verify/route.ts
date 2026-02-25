import { NextResponse } from "next/server";
import { readAuthStore } from "@/app/api/auth/_store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const code = String(body?.code ?? "").trim();

    if (!email || !code) {
      return NextResponse.json({ ok: false, message: "Email and code required." }, { status: 400 });
    }

    const store = await readAuthStore();
    const resetEntry = store.resetCodes[email];

    if (!resetEntry || resetEntry.code !== code) {
      return NextResponse.json({ ok: false, message: "Invalid verification code." }, { status: 401 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, message: "Verification failed." }, { status: 500 });
  }
}
