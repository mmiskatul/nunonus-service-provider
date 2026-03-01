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
  action: "markPaid" | "sendReminder" | "updateBreakdown";
  totalRevenue?: number;
  commissionRate?: number;
  commissionAmount?: number;
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

    if (payload.action === "updateBreakdown") {
      const totalRevenue = Number(payload.totalRevenue ?? 0);
      const commissionRate = Number(payload.commissionRate ?? 0);
      const commissionAmount = Number(payload.commissionAmount ?? 0);
      const netPayable = Math.max(0, totalRevenue - commissionAmount);
      const formatMoney = (value: number) =>
        `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      next.totalEarnings = formatMoney(totalRevenue);
      next.commission = `-${formatMoney(commissionAmount).replace("$", "")}`;
      next.netPayout = formatMoney(netPayable);
      next.details = next.details || {};
      next.details.financialBreakdown = {
        totalRevenue: next.totalEarnings,
        commissionRate: `${commissionRate.toFixed(1)}%`,
        commissionAmount: next.commission,
        cycle: next.details.financialBreakdown?.cycle ?? "Oct 01 - Oct 31, 2025"
      };
      next.details.netPayable = {
        amount: next.netPayout,
        dueDate: next.details.netPayable?.dueDate ?? "Jun 15, 2026",
        invoiceStatus: next.status
      };
    }

    data.recentPayments[index] = next;
    await writeJson("billing.json", data);
    return jsonOk({ payments: data.recentPayments, updated: next });
  } catch {
    return jsonError("Failed to update billing record");
  }
}
