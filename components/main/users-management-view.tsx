"use client";

import { UsersClient } from "@/components/users/client";
import type { SummaryCard, UserProfile } from "@/components/main/users-management-types";

export { UserProfile } from "@/components/main/users-management-types";

type UsersManagementViewProps = {
  initialData: {
    summaryCards: SummaryCard[];
    users: UserProfile[];
  };
};

export function UsersManagementView({ initialData }: UsersManagementViewProps) {
  return <UsersClient initialData={initialData} />;
}
