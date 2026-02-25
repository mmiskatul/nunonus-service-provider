import { promises as fs } from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "data", "users.json");

export type UserRecord = Record<string, any>;
export type UsersPayload = { summaryCards: unknown[]; users: UserRecord[] };

export async function readUsersData(): Promise<UsersPayload> {
  const raw = await fs.readFile(dataPath, "utf-8");
  return JSON.parse(raw) as UsersPayload;
}

export async function writeUsersData(data: UsersPayload): Promise<void> {
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

export async function updateUserAction(id: string, action?: string): Promise<UserRecord | null> {
  const data = await readUsersData();
  const users = data.users as UserRecord[];
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) return null;

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

  users[index] = user;
  data.users = users;
  await writeUsersData(data);
  return user;
}
