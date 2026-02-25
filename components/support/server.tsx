import { headers } from "next/headers";
import { SupportDashboardViewClient } from "@/components/support/client";

type DataPayload = any;

function getBaseUrl() {
  const host = headers().get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function SupportDashboardViewServer() {
  const res = await fetch(`${getBaseUrl()}/api/support`, { cache: "no-store" });
  const data = (await res.json()) as DataPayload;
  return <SupportDashboardViewClient initialData={data} />;
}
