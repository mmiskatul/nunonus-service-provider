import { readJson, writeJson, jsonError, jsonOk } from "@/app/api/_data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await readJson("settings.json");
    return jsonOk(data);
  } catch {
    return jsonError("Failed to read settings data");
  }
}

type SettingsPayload = {
  title?: string;
  description?: string;
  general?: {
    platformName?: string;
    supportEmail?: string;
    brandIdentity?: {
      logoData?: string;
      note?: string;
      cta?: string;
    };
  };
  commission?: {
    globalRate?: string;
    categoryRate?: string;
    categoryLabel?: string;
  };
  admin?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
};

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as SettingsPayload;
    const data = await readJson("settings.json");
    const next = {
      ...data,
      ...payload,
      general: {
        ...data.general,
        ...payload.general,
        brandIdentity: {
          ...data.general?.brandIdentity,
          ...payload.general?.brandIdentity
        }
      },
      commission: { ...data.commission, ...payload.commission },
      admin: { ...data.admin, ...payload.admin }
    };
    await writeJson("settings.json", next);
    return jsonOk(next);
  } catch {
    return jsonError("Failed to update settings data");
  }
}
