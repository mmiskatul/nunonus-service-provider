import { headers } from "next/headers";
import { BillingManagementView } from "@/components/billing/client";

type DataPayload = any;

async function getBaseUrl() {
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function BillingManagementViewServer() {
  const res = await fetch(`${await getBaseUrl()}/api/billing`, { cache: "no-store" });
  const data = (await res.json()) as DataPayload;
  return <BillingManagementView data={data} />;
}
