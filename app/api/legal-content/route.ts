import { jsonError, jsonOk, readJson, writeJson } from "@/app/api/_data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DocumentKey = "terms" | "privacy";
type AudienceKey = "apps" | "business";

type LegalContentData = {
  title: string;
  lastUpdated: string;
  documents: Record<DocumentKey, string>;
  audiences: Record<AudienceKey, string>;
  content: Record<DocumentKey, Record<AudienceKey, string>>;
};

type SettingsData = {
  legalContent: LegalContentData;
};

type UpdatePayload = {
  document?: DocumentKey;
  audience?: AudienceKey;
  content?: string;
};

function isDocumentKey(value: string | undefined): value is DocumentKey {
  return value === "terms" || value === "privacy";
}

function isAudienceKey(value: string | undefined): value is AudienceKey {
  return value === "apps" || value === "business";
}

function formatTimestamp(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).formatToParts(date);

  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const hour = parts.find((part) => part.type === "hour")?.value ?? "";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "";
  const dayPeriod = parts.find((part) => part.type === "dayPeriod")?.value ?? "";

  return `${month} ${day}, ${year} at ${hour}:${minute} ${dayPeriod}`.trim();
}

export async function GET() {
  try {
    const data = (await readJson("settings.json")) as SettingsData;
    return jsonOk(data.legalContent);
  } catch {
    return jsonError("Failed to read legal content data");
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as UpdatePayload;

    if (!isDocumentKey(payload.document) || !isAudienceKey(payload.audience) || typeof payload.content !== "string") {
      return jsonError("Invalid legal content payload");
    }

    const settings = (await readJson("settings.json")) as SettingsData;
    const nextLegalContent: LegalContentData = {
      ...settings.legalContent,
      lastUpdated: formatTimestamp(new Date()),
      content: {
        ...settings.legalContent.content,
        [payload.document]: {
          ...settings.legalContent.content[payload.document],
          [payload.audience]: payload.content
        }
      }
    };

    await writeJson("settings.json", {
      ...settings,
      legalContent: nextLegalContent
    });

    return jsonOk(nextLegalContent);
  } catch {
    return jsonError("Failed to update legal content");
  }
}
