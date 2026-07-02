import { headers } from "next/headers";
import { redirect } from "next/navigation";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function firstHeaderValue(value: string | null) {
  if (!value) return null;
  return value.split(",")[0]?.trim() || null;
}

async function resolveBaseUrl() {
  const headerList = await headers();
  const forwardedHost = firstHeaderValue(headerList.get("x-forwarded-host"));
  const host = forwardedHost ?? firstHeaderValue(headerList.get("host"));
  const forwardedProto = firstHeaderValue(headerList.get("x-forwarded-proto"));
  const protocol = forwardedProto ?? (process.env.NODE_ENV === "development" ? "http" : "https");

  if (host) {
    return `${protocol}://${host}`;
  }

  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;
  if (configuredUrl) {
    return trimTrailingSlash(configuredUrl);
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.RENDER_EXTERNAL_URL) {
    return trimTrailingSlash(process.env.RENDER_EXTERNAL_URL);
  }

  const port = process.env.PORT || "3000";
  return `http://127.0.0.1:${port}`;
}

function cookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function backendBaseUrl() {
  return (process.env.NEXT_PUBLIC_AUTH_API_BASE?.trim() || "https://nunos-backend.vercel.app").replace(/\/+$/, "");
}

async function refreshVendorAccessToken(cookieHeader: string | null) {
  const refreshToken = cookieValue(cookieHeader, "nunos_vendor_refresh_token");
  if (!refreshToken) {
    return null;
  }

  const response = await fetch(`${backendBaseUrl()}/api/v1/vendor/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    detail?: string;
    message?: string;
  };

  if (!response.ok || !payload.access_token) {
    return null;
  }
  return payload.access_token;
}

export async function fetchApiData<T extends object>(path: string): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl = await resolveBaseUrl();
  const headerList = await headers();
  const cookie = headerList.get("cookie");
  const requestUrl = `${baseUrl}${normalizedPath}`;
  let response = await fetch(requestUrl, {
    headers: cookie ? { cookie } : undefined,
    cache: "no-store",
    next: { revalidate: 0 }
  });

  if (response.status === 401) {
    const refreshedAccessToken = await refreshVendorAccessToken(cookie);
    if (refreshedAccessToken) {
      response = await fetch(requestUrl, {
        headers: {
          ...(cookie ? { cookie } : {}),
          Authorization: `Bearer ${refreshedAccessToken}`,
        },
        cache: "no-store",
        next: { revalidate: 0 }
      });
    }
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { detail?: string; message?: string };
    if (response.status === 401) {
      redirect("/auth/login");
    }
    throw new Error(payload.detail || payload.message || `Failed to load ${normalizedPath}`);
  }

  return (await response.json()) as T;
}
