"use client";

import { BillingManagementView } from "@/components/main/billing-management-view";

type DataPayload = any;

type ClientProps = {
  initialData: DataPayload;
};

export function BillingManagementViewClient({ initialData }: ClientProps) {
  return <BillingManagementView data={initialData} />;
}
