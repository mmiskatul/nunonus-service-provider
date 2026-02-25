import { promises as fs } from "fs";
import path from "path";
import { UsersClient } from "@/components/users/client";
import type { SummaryCard, UserProfile } from "@/components/main/users-management-types";

type UsersData = {
  summaryCards: SummaryCard[];
  users: UserProfile[];
};

export async function UsersServer() {
  const dataPath = path.join(process.cwd(), "data", "users.json");
  const raw = await fs.readFile(dataPath, "utf-8");
  const data = JSON.parse(raw) as UsersData;

  return <UsersClient initialData={data} />;
}
