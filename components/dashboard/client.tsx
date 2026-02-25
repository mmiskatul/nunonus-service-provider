"use client";

import type { DashboardData } from "@/components/main/dashboard-view";
import { DashboardView } from "@/components/main/dashboard-view";

type DashboardClientProps = {
  initialData: DashboardData;
};

export function DashboardClient({ initialData }: DashboardClientProps) {
  return <DashboardView data={initialData} />;
}
