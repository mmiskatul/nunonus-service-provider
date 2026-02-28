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

type UpdateOfferPayload = CreateOfferPayload & { id: string };

export async function PUT(request: Request) {
  try {
    const payload = (await request.json()) as UpdateOfferPayload;
    if (!payload?.id) return jsonError("Offer id is required");
    const data = await readJson("offers.json");
    const index = (data.offers || []).findIndex((offer: { id: string }) => offer.id === payload.id);
    if (index === -1) return jsonError("Offer not found");

    const current = data.offers[index];
    const discount =
      payload.discountType === "PERCENT"
        ? `${payload.discountValue}% OFF`
        : payload.discountType === "FLAT"
          ? `$${Number(payload.discountValue || 0).toFixed(2)} Flat`
          : "BOGO Free";
    const start = payload.startDate ? formatDate(payload.startDate) : "";
    const end = payload.endDate ? formatDate(payload.endDate) : "";
    const validity = start && end ? `${start} - ${end}` : current.validity;
    const next = {
      ...current,
      name: payload.name,
      discount,
      validity,
      appliedTo: payload.appliedTo,
      status: payload.active ? "Active" : "Inactive",
      kind: payload.discountType
    };

    data.offers[index] = next;
    const activeCard = (data.summaryCards || []).find(
      (card: { label: string }) => card.label === "ACTIVE OFFERS"
    );
    if (activeCard && current.status !== next.status) {
      const delta = next.status === "Active" ? 1 : -1;
      const nextValue = Math.max(0, parseCount(activeCard.value) + delta);
      activeCard.value = nextValue.toLocaleString();
    }

    await writeJson("offers.json", data);
    return jsonOk({ offer: next, offers: data.offers });
  } catch {
    return jsonError("Failed to update offer");
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as { id: string; active: boolean };
    if (!payload?.id) return jsonError("Offer id is required");
    const data = await readJson("offers.json");
    const index = (data.offers || []).findIndex((offer: { id: string }) => offer.id === payload.id);
    if (index === -1) return jsonError("Offer not found");
    const current = data.offers[index];
    const nextStatus = payload.active ? "Active" : "Inactive";
    data.offers[index] = { ...current, status: nextStatus };

    const activeCard = (data.summaryCards || []).find(
      (card: { label: string }) => card.label === "ACTIVE OFFERS"
    );
    if (activeCard && current.status !== nextStatus) {
      const delta = nextStatus === "Active" ? 1 : -1;
      const nextValue = Math.max(0, parseCount(activeCard.value) + delta);
      activeCard.value = nextValue.toLocaleString();
    }

    await writeJson("offers.json", data);
    return jsonOk({ offers: data.offers });
  } catch {
    return jsonError("Failed to update offer status");
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = (await request.json()) as { id: string };
    if (!payload?.id) return jsonError("Offer id is required");
    const data = await readJson("offers.json");
    const index = (data.offers || []).findIndex((offer: { id: string }) => offer.id === payload.id);
    if (index === -1) return jsonError("Offer not found");
    const [removed] = data.offers.splice(index, 1);

    const activeCard = (data.summaryCards || []).find(
      (card: { label: string }) => card.label === "ACTIVE OFFERS"
    );
    if (activeCard && removed?.status === "Active") {
      const nextValue = Math.max(0, parseCount(activeCard.value) - 1);
      activeCard.value = nextValue.toLocaleString();
    }

    await writeJson("offers.json", data);
    return jsonOk({ offers: data.offers });
  } catch {
    return jsonError("Failed to delete offer");
  }
}
