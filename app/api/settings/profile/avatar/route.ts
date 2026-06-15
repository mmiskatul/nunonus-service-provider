import { NextRequest, NextResponse } from "next/server";
import { backendUrl, resolveAuthHeader } from "@/app/api/backend-proxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const headers: Record<string, string> = {};
    const auth = resolveAuthHeader(request);
    if (auth) headers.Authorization = auth;

    const response = await fetch(backendUrl("/platform-admin/settings/profile/avatar"), {
      method: "POST",
      headers,
      body: formData
    });

    const payload = await response.json().catch(() => ({}));
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: "Backend unavailable", detail: String(error) },
      { status: 502 }
    );
  }
}
