import { VendorsManagementView } from "@/components/vendors/client";
import { fetchApiData } from "@/lib/server-api";

type DataPayload = {
  summaryCards: Array<{ label: string; value: string; note: string; tone: string }>;
  vendors: Array<{
    id: string;
    businessName: string;
    owner: string;
    category: "HOSPITALITY" | "DINING" | "RENTALS";
    bookings: number;
    rating: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    avatar: string;
    verification: {
      description: string;
      address: string;
      reviewScore: number;
      reviewCount: number;
      docs: Array<{ title: string; state: "Verified" | "Rejected" }>;
    };
  }>;
};

const fallbackData: DataPayload = {
  summaryCards: [],
  vendors: []
};

export async function VendorsManagementViewServer() {
  const data = await fetchApiData<DataPayload>("/api/vendors", fallbackData);
  return <VendorsManagementView data={data} />;
}
