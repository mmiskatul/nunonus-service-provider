import { NextResponse } from "next/server";
import { updateUserAction } from "@/lib/users-server";

export async function PATCH(request: Request, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    const body = await request.json();
    const action = body?.action as string | undefined;
    const updatedUser = await updateUserAction(id, action);

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
