"use client";

import { useUsersManagement } from "@/components/main/users-management-logic";
import { UsersManagementUI } from "@/components/main/users-management-ui";

export { UserProfile } from "@/components/main/users-management-types";

export function UsersManagementView() {
  const logic = useUsersManagement();
  return <UsersManagementUI {...logic} />;
}
