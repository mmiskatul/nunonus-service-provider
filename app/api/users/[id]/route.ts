import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "data", "users.json");
type JsonObject = Record<string, unknown>;

async function readUsersFile() {
  const raw = await fs.readFile(dataPath, "utf-8");
  return JSON.parse(raw);
}

async function writeUsersFile(data: unknown) {
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as JsonObject;
    const action = body.action as string | undefined;

    const data = (await readUsersFile()) as JsonObject;
    const users = Array.isArray(data.users) ? (data.users as JsonObject[]) : [];
    const index = users.findIndex((user) => user.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = users[index];

    if (action === "block") {
      user.status = "BLOCKED";
      user.actions = (user.actions || []).map((actionItem: { label: string; tone: string }) => {
        if (actionItem.label.toLowerCase().includes("block")) {
          return {
            ...actionItem,
            label: "Unblock Account",
            tone: "neutral"
          };
        }
        return actionItem;
      });
    }

    if (action === "unblock") {
      user.status = "ACTIVE";
      user.actions = (user.actions || []).map((actionItem: { label: string; tone: string }) => {
        if (actionItem.label.toLowerCase().includes("block")) {
          return {
            ...actionItem,
            label: "Block Account",
            tone: "danger"
          };
        }
        return actionItem;
      });
    }

    if (action === "resetPassword") {
      user.actions = (user.actions || []).map((actionItem: { label: string; tone: string }) => {
        if (actionItem.label.toLowerCase().includes("reset password")) {
          return { ...actionItem, label: "Password Reset Sent", tone: "neutral" };
        }
        return actionItem;
      });
    }

    if (action === "updateUser") {
      const update = (body.data as JsonObject | undefined) ?? {};
      users[index] = { ...user, ...update };
    }

    data.users = users;
    await writeUsersFile(data);

    return NextResponse.json({ user: users[index] }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
