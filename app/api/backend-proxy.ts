/**
 * backend-proxy.ts
 * Helper to proxy Next.js API route requests to the FastAPI backend.
 * Forwards Authorization headers or falls back to nunos_dashboard_access_token cookie.
 */

import { NextRequest, NextResponse } from "next/server";

function getBackendBase(): string {
  const value = process.env.NEXT_PUBLIC_AUTH_API_BASE?.trim();
  if (!value) {
    throw new Error("NEXT_PUBLIC_AUTH_API_BASE is not configured.");
  }
  return value.replace(/\/+$/, "");
}

export function backendUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getBackendBase()}/api/v1${normalized}`;
}

export function resolveAuthHeader(request: Request | NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (auth) return auth;

  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/nunos_dashboard_access_token=([^;]+)/);
  if (match && match[1]) {
    return `Bearer ${decodeURIComponent(match[1])}`;
  }

  if ("cookies" in request && typeof (request as any).cookies?.get === "function") {
    const token = (request as any).cookies.get("nunos_dashboard_access_token")?.value;
    if (token) {
      return `Bearer ${token}`;
    }
  }

  return null;
}

export async function proxyGet(
  request: NextRequest,
  backendPath: string,
): Promise<NextResponse> {
  try {
    const url = new URL(backendUrl(backendPath));
    // Forward query params from the incoming request
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const auth = resolveAuthHeader(request);
    if (auth) headers["Authorization"] = auth;

    const res = await fetch(url.toString(), { method: "GET", headers, cache: "no-store" });
    const data = await res.json().catch(() => ({}));

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: "Backend unavailable", detail: String(err) },
      { status: 502 },
    );
  }
}

export async function proxyPost(
  request: NextRequest,
  backendPath: string,
): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => ({}));
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const auth = resolveAuthHeader(request);
    if (auth) headers["Authorization"] = auth;

    const res = await fetch(backendUrl(backendPath), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: "Backend unavailable", detail: String(err) },
      { status: 502 },
    );
  }
}

export async function proxyPatch(
  request: NextRequest,
  backendPath: string,
): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => ({}));
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const auth = resolveAuthHeader(request);
    if (auth) headers["Authorization"] = auth;

    const res = await fetch(backendUrl(backendPath), {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: "Backend unavailable", detail: String(err) },
      { status: 502 },
    );
  }
}

export async function proxyDelete(
  request: NextRequest,
  backendPath: string,
): Promise<NextResponse> {
  try {
    const headers: Record<string, string> = {};
    const auth = resolveAuthHeader(request);
    if (auth) headers["Authorization"] = auth;

    const res = await fetch(backendUrl(backendPath), {
      method: "DELETE",
      headers,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: "Backend unavailable", detail: String(err) },
      { status: 502 },
    );
  }
}
