import { headers } from "next/headers";
import { OffersManagementViewClient } from "@/components/offers/client";

type DataPayload = any;

function getBaseUrl() {
  const host = headers().get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function OffersManagementViewServer() {
  const res = await fetch(`${getBaseUrl()}/api/offers`, { cache: "no-store" });
  const data = (await res.json()) as DataPayload;
  return <OffersManagementViewClient initialData={data} />;
}
