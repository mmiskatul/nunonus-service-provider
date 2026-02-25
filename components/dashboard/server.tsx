import { headers } from "next/headers";
import { DashboardView } from "@/components/dashboard/client";

type DataPayload = any;

function getBaseUrl() {
  const host = headers().get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function DashboardViewServer() {
  const res = await fetch(`${getBaseUrl()}/api/dashboard`, { cache: "no-store" });
  const data = (await res.json()) as DataPayload;
  return <DashboardView data={data} />;
}
