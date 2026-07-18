/**
 * backend-proxy.ts
 * Helper to proxy Next.js API route requests to the FastAPI backend.
 * Forwards Authorization headers or falls back to nunos_vendor_access_token cookie.
 */

import { NextRequest, NextResponse } from "next/server";

const DEFAULT_BACKEND_BASE_URL = "https://nunos-backend.vercel.app";

function getBackendBase(): string {
  return (process.env.NEXT_PUBLIC_AUTH_API_BASE?.trim() || DEFAULT_BACKEND_BASE_URL).replace(/\/+$/, "");
}

export function backendUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getBackendBase()}/api/v1${normalized}`;
}

export function resolveAuthHeader(request: Request | NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (auth) return auth;

  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/nunos_vendor_access_token=([^;]+)/);
  if (match && match[1]) {
    return `Bearer ${decodeURIComponent(match[1])}`;
  }

  if (request instanceof NextRequest) {
    const token = request.cookies.get("nunos_vendor_access_token")?.value;
    if (token) {
      return `Bearer ${token}`;
    }
  }

  return null;
}

function cookieValue(request: Request | NextRequest, name: string): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }

  if (request instanceof NextRequest) {
    return request.cookies.get(name)?.value ?? null;
  }

  return null;
}

async function refreshVendorAccessToken(request: Request | NextRequest): Promise<string | null> {
  const refreshToken = cookieValue(request, "nunos_vendor_refresh_token");
  if (!refreshToken) {
    return null;
  }

  const response = await fetch(backendUrl("/vendor/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    session_token?: string;
  };

  if (!response.ok || !payload.access_token) {
    return null;
  }

  return payload.access_token;
}

function applyVendorCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken?: string,
): NextResponse {
  response.cookies.set("nunos_vendor_auth", "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  response.cookies.set("nunos_vendor_access_token", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  if (refreshToken) {
    response.cookies.set("nunos_vendor_refresh_token", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return response;
}

async function fetchBackendWithRefresh(
  request: Request | NextRequest,
  url: string,
  init: RequestInit,
): Promise<{ response: Response; accessToken?: string }> {
  const first = await fetch(url, init);
  if (first.status !== 401) {
    return { response: first };
  }

  const accessToken = await refreshVendorAccessToken(request);
  if (!accessToken) {
    return { response: first };
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  const retry = await fetch(url, { ...init, headers });
  return { response: retry, accessToken };
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

    const { response: res, accessToken } = await fetchBackendWithRefresh(request, url.toString(), {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));

    const nextResponse = NextResponse.json(data, { status: res.status });
    return accessToken ? applyVendorCookies(nextResponse, accessToken) : nextResponse;
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
    const contentType = request.headers.get("content-type") || "application/json";
    const isJson = contentType.includes("application/json");
    const body: BodyInit = isJson
      ? JSON.stringify(await request.json().catch(() => ({})))
      : await request.arrayBuffer();
    const headers: Record<string, string> = { "Content-Type": contentType };
    const auth = resolveAuthHeader(request);
    if (auth) headers["Authorization"] = auth;

    const { response: res, accessToken } = await fetchBackendWithRefresh(request, backendUrl(backendPath), {
      method: "POST",
      headers,
      body,
    });
    const data = await res.json().catch(() => ({}));
    const nextResponse = NextResponse.json(data, { status: res.status });
    return accessToken ? applyVendorCookies(nextResponse, accessToken) : nextResponse;
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

    const { response: res, accessToken } = await fetchBackendWithRefresh(request, backendUrl(backendPath), {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    const nextResponse = NextResponse.json(data, { status: res.status });
    return accessToken ? applyVendorCookies(nextResponse, accessToken) : nextResponse;
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

    const { response: res, accessToken } = await fetchBackendWithRefresh(request, backendUrl(backendPath), {
      method: "DELETE",
      headers,
    });
    const data = await res.json().catch(() => ({}));
    const nextResponse = NextResponse.json(data, { status: res.status });
    return accessToken ? applyVendorCookies(nextResponse, accessToken) : nextResponse;
  } catch (err) {
    return NextResponse.json(
      { error: "Backend unavailable", detail: String(err) },
      { status: 502 },
    );
  }
}
