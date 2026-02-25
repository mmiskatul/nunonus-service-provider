import { headers } from "next/headers";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

async function resolveBaseUrl() {
  const headerList = await headers();
  const forwardedHost = headerList.get("x-forwarded-host");
  const host = forwardedHost ?? headerList.get("host");
  const forwardedProto = headerList.get("x-forwarded-proto");
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

  return "http://localhost:3000";
}

export async function fetchApiData<T>(path: string, fallback: T): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  try {
    const baseUrl = await resolveBaseUrl();
    const response = await fetch(`${baseUrl}${normalizedPath}`, {
      cache: "no-store",
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      return fallback;
    }

    const data = (await response.json()) as T;
    return data ?? fallback;
  } catch {
    return fallback;
  }
}
