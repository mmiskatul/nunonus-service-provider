import { NextResponse } from "next/server";

const METRIC_NAMES = new Set(["CLS", "FCP", "INP", "LCP", "TTFB"]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || !METRIC_NAMES.has(String(body.name)) || !Number.isFinite(Number(body.value))) {
    return NextResponse.json({ error: "Invalid metric" }, { status: 400 });
  }
  console.info("web_vital", {
    name: String(body.name),
    value: Number(body.value),
    rating: String(body.rating ?? ""),
    path: String(body.path ?? "").slice(0, 200),
  });
  return new NextResponse(null, { status: 204 });
}
