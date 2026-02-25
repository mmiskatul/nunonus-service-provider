import { headers } from "next/headers";
import { VendorsManagementViewClient } from "@/components/vendors/client";

type DataPayload = any;

function getBaseUrl() {
  const host = headers().get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function VendorsManagementViewServer() {
  const res = await fetch(`${getBaseUrl()}/api/vendors`, { cache: "no-store" });
  const data = (await res.json()) as DataPayload;
  return <VendorsManagementViewClient initialData={data} />;
}
