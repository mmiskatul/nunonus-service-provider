import { jsonError } from "@/app/api/_data";
import { NextResponse } from "next/server";

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
    return NextResponse.json(
      {
        error: "Admin credentials are managed by the backend environment and backend auth flow."
      },
      { status: 400 }
    );
  } catch {
    return jsonError("Failed to update password");
  }
}
