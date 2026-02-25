import { headers } from "next/headers";
import { DashboardView } from "@/components/dashboard/client";

type DataPayload = any;

async function getBaseUrl() {
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function DashboardViewServer() {
  const res = await fetch(`${await getBaseUrl()}/api/dashboard`, { cache: "no-store" });
  const data = (await res.json()) as DataPayload;
  return <DashboardView data={data} />;
}
