"use client";

import { SupportDashboardView } from "@/components/main/support-dashboard-view";

type DataPayload = any;

type ClientProps = {
  initialData: DataPayload;
};

export function SupportDashboardViewClient({ initialData }: ClientProps) {
  return <SupportDashboardView data={initialData} />;
}
