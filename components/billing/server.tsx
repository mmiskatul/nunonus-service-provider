import { headers } from "next/headers";
import { BillingManagementViewClient } from "@/components/billing/client";

type DataPayload = any;

function getBaseUrl() {
  const host = headers().get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function BillingManagementViewServer() {
  const res = await fetch(`${getBaseUrl()}/api/billing`, { cache: "no-store" });
  const data = (await res.json()) as DataPayload;
  return <BillingManagementViewClient initialData={data} />;
}
