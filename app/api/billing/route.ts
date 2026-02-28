import { readJson, writeJson, jsonError, jsonOk } from "@/app/api/_data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await readJson("billing.json");
    return jsonOk(data);
  } catch {
    return jsonError("Failed to read billing data");
  }
}

type BillingActionPayload = {
  vendorCode: string;
  vendorName: string;
  action: "markPaid" | "sendReminder";
};

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as BillingActionPayload;
    if (!payload?.vendorCode || !payload?.vendorName || !payload?.action) {
      return jsonError("Invalid billing action");
    }

    const data = await readJson("billing.json");
    const index = (data.recentPayments || []).findIndex(
      (row: { vendorCode: string; vendorName: string }) =>
        row.vendorCode === payload.vendorCode && row.vendorName === payload.vendorName
    );
    if (index === -1) return jsonError("Billing record not found");

    const current = data.recentPayments[index];
    const next = { ...current };

    if (payload.action === "markPaid") {
      next.status = "PAID";
      if (next.details?.netPayable) {
        next.details.netPayable.invoiceStatus = "PAID";
      }
      if (next.details?.history) {
        next.details.history.unshift({
          id: `TXN-${Date.now().toString().slice(-4)}-PD`,
          date: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric"
          }),
          amount: next.netPayout,
          status: "PAID"
        });
      }
    }

    if (payload.action === "sendReminder") {
      next.details = next.details || {};
      next.details.reminderSentAt = new Date().toISOString();
    }

    data.recentPayments[index] = next;
    await writeJson("billing.json", data);
    return jsonOk({ payments: data.recentPayments, updated: next });
  } catch {
    return jsonError("Failed to update billing record");
  }
}
