import { readAuthStore, writeAuthStore } from "@/app/api/auth/_store";
import { jsonError, jsonOk } from "@/app/api/_data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type UpdatePasswordPayload = {
  email: string;
  currentPassword: string;
  newPassword: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as UpdatePasswordPayload;
    if (!payload?.email || !payload?.currentPassword || !payload?.newPassword) {
      return jsonError("Invalid password payload");
    }

    const store = await readAuthStore();
    const index = store.users.findIndex((user) => user.email === payload.email);
    if (index === -1) return jsonError("User not found");
    if (store.users[index].password !== payload.currentPassword) {
      return jsonError("Current password is incorrect");
    }

    store.users[index].password = payload.newPassword;
    await writeAuthStore(store);
    return jsonOk({ success: true });
  } catch {
    return jsonError("Failed to update password");
  }
}
