import { headers } from "next/headers";
import { DashboardView } from "@/components/dashboard/client";
import dashboardFallback from "@/data/dashboard.json";

type DataPayload = any;

async function getBaseUrl() {
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function DashboardViewServer() {
  try {
    const res = await fetch(`${await getBaseUrl()}/api/dashboard`, { cache: "no-store" });
    if (!res.ok) {
      return <DashboardView data={dashboardFallback as DataPayload} />;
    }
    const data = (await res.json()) as DataPayload;
    if (!data?.stats || !data?.bookingByRange) {
      return <DashboardView data={dashboardFallback as DataPayload} />;
    }
    return <DashboardView data={data} />;
  } catch {
    return <DashboardView data={dashboardFallback as DataPayload} />;
  }
}
