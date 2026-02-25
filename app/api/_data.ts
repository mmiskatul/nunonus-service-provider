import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function readJson(file: string) {
  const filePath = path.join(process.cwd(), "data", file);
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

export function jsonOk(data: unknown) {
  return NextResponse.json(data, { status: 200 });
}

export function jsonError(message: string) {
  return NextResponse.json({ error: message }, { status: 500 });
}
