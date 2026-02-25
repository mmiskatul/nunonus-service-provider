"use client";

import { OffersManagementView } from "@/components/main/offers-management-view";

type DataPayload = any;

type ClientProps = {
  initialData: DataPayload;
};

export function OffersManagementViewClient({ initialData }: ClientProps) {
  return <OffersManagementView data={initialData} />;
}
