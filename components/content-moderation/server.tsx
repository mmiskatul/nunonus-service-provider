import { headers } from "next/headers";
import { ContentManagementView } from "@/components/content-moderation/client";

type DataPayload = any;

async function getBaseUrl() {
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function ContentManagementViewServer() {
  const res = await fetch(`${await getBaseUrl()}/api/content-moderation`, { cache: "no-store" });
  const data = (await res.json()) as DataPayload;
  return <ContentManagementView data={data} />;
}
