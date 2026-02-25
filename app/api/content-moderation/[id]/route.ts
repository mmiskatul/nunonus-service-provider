import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "data", "content-moderation.json");

async function readModerationFile() {
  const raw = await fs.readFile(dataPath, "utf-8");
  return JSON.parse(raw);
}

async function writeModerationFile(data: unknown) {
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);
    const body = await request.json();
    const action = body?.action as "approved" | "rejected" | "pending" | undefined;

    const data = await readModerationFile();
    const items = data.items as Array<Record<string, any>>;
    const index = items.findIndex((item) => item.id === decodedId);

    if (index === -1) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (action) {
      items[index] = { ...items[index], state: action };
    }

    data.items = items;
    await writeModerationFile(data);

    return NextResponse.json({ item: items[index] }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to update submission" }, { status: 500 });
  }
}
