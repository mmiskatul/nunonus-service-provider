import { headers } from "next/headers";
import { SupportDashboardView } from "@/components/support/client";

type DataPayload = any;

async function getBaseUrl() {
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function SupportDashboardViewServer() {
  const res = await fetch(`${await getBaseUrl()}/api/support`, { cache: "no-store" });
  const data = (await res.json()) as DataPayload;
  return <SupportDashboardView data={data} />;
}
