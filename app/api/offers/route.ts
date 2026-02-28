import { readJson, writeJson, jsonError, jsonOk } from "@/app/api/_data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await readJson("offers.json");
    return jsonOk(data);
  } catch {
    return jsonError("Failed to read offers data");
  }
}

type CreateOfferPayload = {
  name: string;
  discountType: "PERCENT" | "FLAT" | "BOGO";
  discountValue: number;
  startDate?: string;
  endDate?: string;
  appliedTo: string;
  active: boolean;
};

function formatDate(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-US", { month: "short", day: "2-digit" });
}

function parseCount(value: string) {
  const numeric = Number(value.replace(/[^\d]/g, ""));
  return Number.isNaN(numeric) ? 0 : numeric;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateOfferPayload;
    if (!payload?.name) return jsonError("Offer name is required");

    const data = await readJson("offers.json");
    const discount =
      payload.discountType === "PERCENT"
        ? `${payload.discountValue}% OFF`
        : payload.discountType === "FLAT"
          ? `$${Number(payload.discountValue || 0).toFixed(2)} Flat`
          : "BOGO Free";
    const start = formatDate(payload.startDate);
    const end = formatDate(payload.endDate);
    const validity = start && end ? `${start} - ${end}` : "Ongoing";
    const nextOffer = {
      id: `#OFR-${String(Date.now()).slice(-4)}`,
      name: payload.name,
      discount,
      validity,
      appliedTo: payload.appliedTo,
      status: payload.active ? "Active" : "Inactive",
      redemptions: 0,
      kind: payload.discountType
    };

    data.offers = [nextOffer, ...(data.offers || [])];
    const activeCard = (data.summaryCards || []).find(
      (card: { label: string }) => card.label === "ACTIVE OFFERS"
    );
    if (activeCard && payload.active) {
      const nextValue = parseCount(activeCard.value) + 1;
      activeCard.value = nextValue.toLocaleString();
    }

    await writeJson("offers.json", data);
    return jsonOk({ offer: nextOffer, offers: data.offers });
  } catch {
    return jsonError("Failed to create offer");
  }
}
