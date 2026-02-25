import type { UserProfile } from "@/components/main/users-management-types";

export type UsersResponse = {
  summaryCards: Array<{
    label: string;
    value: string;
    trend: string;
    tone: string;
    icon: "users" | "user" | "blocked" | "new";
    iconWrap: string;
  }>;
  users: UserProfile[];
};

export async function fetchUsers(signal?: AbortSignal): Promise<UsersResponse> {
  const response = await fetch("/api/users", { signal });
  if (!response.ok) {
    throw new Error("Failed to load users");
  }
  return (await response.json()) as UsersResponse;
}

export async function updateUserAction(
  id: string,
  action: "toggleStatus" | "resetPassword"
): Promise<UserProfile> {
  const response = await fetch(`/api/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action })
  });

  if (!response.ok) {
    throw new Error("Failed to update user");
  }

  const data = (await response.json()) as { user: UserProfile };
  return data.user;
}
