"use client";

import { ContentManagementView } from "@/components/main/content-management-view";

type DataPayload = any;

type ClientProps = {
  initialData: DataPayload;
};

export function ContentManagementViewClient({ initialData }: ClientProps) {
  return <ContentManagementView data={initialData} />;
}
