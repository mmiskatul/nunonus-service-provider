import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "data", "users.json");

async function readUsersFile() {
  const raw = await fs.readFile(dataPath, "utf-8");
  return JSON.parse(raw);
}

export async function GET() {
  try {
    const data = await readUsersFile();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to read users data" }, { status: 500 });
  }
}
