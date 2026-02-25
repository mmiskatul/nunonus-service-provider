import { headers } from "next/headers";
import { OffersManagementView } from "@/components/offers/client";

type DataPayload = any;

async function getBaseUrl() {
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function OffersManagementViewServer() {
  const res = await fetch(`${await getBaseUrl()}/api/offers`, { cache: "no-store" });
  const data = (await res.json()) as DataPayload;
  return <OffersManagementView data={data} />;
}
