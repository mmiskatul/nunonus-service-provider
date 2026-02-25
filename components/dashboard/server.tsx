import { headers } from "next/headers";
import { DashboardClient } from "@/components/dashboard/client";
import type { DashboardData } from "@/components/main/dashboard-view";

function getBaseUrl() {
  const host = headers().get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function DashboardServer() {
  const res = await fetch(`${getBaseUrl()}/api/dashboard`, { cache: "no-store" });
  const data = (await res.json()) as DashboardData;
  return <DashboardClient initialData={data} />;
}
