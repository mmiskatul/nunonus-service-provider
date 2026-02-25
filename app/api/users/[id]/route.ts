import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "data", "users.json");

async function readUsersFile() {
  const raw = await fs.readFile(dataPath, "utf-8");
  return JSON.parse(raw);
}

async function writeUsersFile(data: unknown) {
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    const body = await request.json();
    const action = body?.action as string | undefined;

    const data = await readUsersFile();
    const users = data.users as Array<Record<string, any>>;
    const index = users.findIndex((user) => user.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = users[index];

    if (action === "toggleStatus") {
      const nextStatus = user.status === "BLOCKED" ? "ACTIVE" : "BLOCKED";
      user.status = nextStatus;
      user.actions = (user.actions || []).map((actionItem: { label: string; tone: string }) => {
        if (actionItem.label.toLowerCase().includes("block")) {
          return {
            ...actionItem,
            label: nextStatus === "BLOCKED" ? "Unblock Account" : "Block Account",
            tone: nextStatus === "BLOCKED" ? "neutral" : "danger"
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
      const update = body?.data ?? {};
      users[index] = { ...user, ...update };
    }

    data.users = users;
    await writeUsersFile(data);

    return NextResponse.json({ user: users[index] }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
