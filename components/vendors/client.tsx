"use client";

import { VendorsManagementView } from "@/components/main/vendors-management-view";

type DataPayload = any;

type ClientProps = {
  initialData: DataPayload;
};

export function VendorsManagementViewClient({ initialData }: ClientProps) {
  return <VendorsManagementView data={initialData} />;
}
