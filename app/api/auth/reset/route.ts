import { NextResponse } from "next/server";
import { readAuthStore, writeAuthStore } from "@/app/api/auth/_store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ ok: false, message: "Email and password required." }, { status: 400 });
    }

    const store = await readAuthStore();
    const index = store.users.findIndex((user) => user.email.toLowerCase() === email);

    if (index === -1) {
      return NextResponse.json({ ok: false, message: "Account not found." }, { status: 404 });
    }

    if (!store.resetCodes[email]) {
      return NextResponse.json({ ok: false, message: "Verification required." }, { status: 401 });
    }

    store.users[index] = { ...store.users[index], password };
    delete store.resetCodes[email];
    await writeAuthStore(store);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, message: "Reset failed." }, { status: 500 });
  }
}
