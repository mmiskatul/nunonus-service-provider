import { OffersManagementView } from "@/components/offers/client";
import { fetchApiData } from "@/lib/server-api";

type DataPayload = {
  summaryCards: Array<{ label: string; value: string; note: string; tone: string }>;
  offers: Array<{
    id: string;
    name: string;
    discount: string;
    validity: string;
    appliedTo: string;
    status: "Active" | "Inactive";
    redemptions: number;
    kind: "PERCENT" | "FLAT" | "BOGO";
    startDate: string;
    endDate: string;
    discountValue: number;
    providerCount: number;
    engagedUsers: number;
    providerBreakdown: Array<{
      providerId: string;
      providerName: string;
      vendorCategory: string;
      status: string;
      redemptions: number;
      engagedUsers: number;
      active: boolean;
    }>;
  }>;
};

const fallbackData: DataPayload = {
  summaryCards: [],
  offers: []
};

export async function OffersManagementViewServer() {
  const data = await fetchApiData<DataPayload>("/api/offers", fallbackData);
  return <OffersManagementView data={data} />;
}
