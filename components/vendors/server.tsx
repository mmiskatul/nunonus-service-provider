import { headers } from "next/headers";
import { VendorsManagementView } from "@/components/vendors/client";

type DataPayload = any;

async function getBaseUrl() {
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function VendorsManagementViewServer() {
  const res = await fetch(`${await getBaseUrl()}/api/vendors`, { cache: "no-store" });
  const data = (await res.json()) as DataPayload;
  return <VendorsManagementView data={data} />;
}
