import { UsersClient } from "@/components/users/client";
import type { SummaryCard, UserProfile } from "@/components/main/users-management-types";
import { headers } from "next/headers";

type UsersData = {
  summaryCards: SummaryCard[];
  users: UserProfile[];
};

function getBaseUrl() {
  const host = headers().get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function UsersServer() {
  const res = await fetch(`${getBaseUrl()}/api/users`, { cache: "no-store" });
  const data = (await res.json()) as UsersData;
  return <UsersClient initialData={data} />;
}
