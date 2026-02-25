import { NextResponse } from "next/server";
import { readUsersData } from "@/lib/users-server";

export async function GET() {
  try {
    const data = await readUsersData();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to read users data" }, { status: 500 });
  }
}
