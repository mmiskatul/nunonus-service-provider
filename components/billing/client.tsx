"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiDollarSign,
  FiEye,
  FiDownload,
  FiX,
  FiPercent,
  FiSearch,
  FiSend,
  FiCheckCircle,
  FiUsers
} from "react-icons/fi";

type PaymentStatus = "PAID" | "PENDING";

type PaymentRow = {
  vendorCode: string;
  vendorName: string;
  totalEarnings: string;
  commission: string;
  netPayout: string;
  status: PaymentStatus;
  details?: {
    profile?: {
      vendorTitle?: string;
      location?: string;
      category?: string;
      joinedDate?: string;
      lastBillingDate?: string;
      image?: string;
    };
    netPayable?: {
      amount?: string;
      dueDate?: string;
      invoiceStatus?: string;
    };
    financialBreakdown?: {
      totalRevenue?: string;
      commissionRate?: string;
      commissionAmount?: string;
      cycle?: string;
    };
    history?: Array<{ id: string; date: string; amount: string; status: PaymentStatus }>;
  };
};

function payoutStatusClass(status: PaymentStatus) {
  if (status === "PAID") return "bg-[#dcfce7] text-[#15803d]";
  return "bg-[#fef3c7] text-[#b45309]";
}

const pageSize = 5;

export function BillingManagementView({
  data
}: {
  data: { summaryCards: Array<{ label: string; value: string; note: string; tone: string }>; recentPayments: PaymentRow[] };
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [payments, setPayments] = useState<PaymentRow[]>(data.recentPayments);
  const [detailsPayment, setDetailsPayment] = useState<PaymentRow | null>(null);
  const [billingActionLoading, setBillingActionLoading] = useState<"download" | "reminder" | "paid" | null>(null);

  const filteredPayments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return payments;
    return payments.filter((payment) => {
      return (
        payment.vendorName.toLowerCase().includes(normalizedQuery) ||
        payment.vendorCode.toLowerCase().includes(normalizedQuery) ||
        payment.totalEarnings.toLowerCase().includes(normalizedQuery) ||
        payment.netPayout.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [payments, query]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const pagedPayments = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, page]);

  const handleBillingAction = async (action: "markPaid" | "sendReminder") => {
    if (!detailsPayment) return;
    setBillingActionLoading(action === "markPaid" ? "paid" : "reminder");
    try {
      const response = await fetch("/api/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorCode: detailsPayment.vendorCode,
          vendorName: detailsPayment.vendorName,
          action
        })
      });
      if (!response.ok) throw new Error("Billing action failed");
      const payload = (await response.json()) as { payments: PaymentRow[]; updated: PaymentRow };
      if (payload?.payments?.length) {
        setPayments(payload.payments);
        setDetailsPayment(payload.updated);
      }
    } finally {
      setBillingActionLoading(null);
    }
  };

  const handleDownloadInvoice = () => {
    if (!detailsPayment) return;
    setBillingActionLoading("download");
    const lines = [
      "Invoice",
      `Vendor: ${detailsPayment.vendorName}`,
      `Vendor Code: ${detailsPayment.vendorCode}`,
      `Total Earnings: ${detailsPayment.totalEarnings}`,
      `Commission: ${detailsPayment.commission}`,
      `Net Payout: ${detailsPayment.netPayout}`,
      `Status: ${detailsPayment.status}`
    ];
    const pdf = buildSimplePdf(lines);
    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${detailsPayment.vendorCode}-invoice.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    setBillingActionLoading(null);
  };

  const buildSimplePdf = (lines: string[]) => {
    const escape = (value: string) =>
      value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
    const contentLines = [
      "BT",
      "/F1 12 Tf",
      "50 750 Td",
      ...lines.map((line, index) => `${index === 0 ? "" : "T* " }(${escape(line)}) Tj`),
      "ET"
    ];
    const stream = contentLines.join("\n");
    const objects: string[] = [];
    objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");
    objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj");
    objects.push(
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj"
    );
    objects.push(`4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`);
    objects.push("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj");

    let pdf = "%PDF-1.4\n";
    const offsets: number[] = [0];
    objects.forEach((obj) => {
      offsets.push(pdf.length);
      pdf += `${obj}\n`;
    });
    const xrefOffset = pdf.length;
    pdf += "xref\n0 6\n0000000000 65535 f \n";
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n";
    pdf += `${xrefOffset}\n%%EOF`;
    return pdf;
  };

  return (
    <section className="space-y-4">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {data.summaryCards.map((card, index) => (
          <article key={card.label} className="rounded-2xl border border-[#e6ecf7] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#edf2fb] text-[#1f3d8f]">
                {index === 0 && <FiDollarSign size={16} />}
                {index === 1 && <FiPercent size={16} />}
                {index === 2 && <FiCreditCard size={16} />}
                {index === 3 && <FiUsers size={16} />}
              </div>
              <span className={`text-[10px] font-semibold ${card.tone}`}>{card.note}</span>
            </div>
            <p className="m-0 text-[10px] text-[#7d8ba6]">{card.label}</p>
            <h3 className="m-0 mt-1 text-[24px] leading-none text-[#1d2a43]">{card.value}</h3>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e6ecf7] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#e6ecf7] px-4 py-3 md:flex-row md:items-center md:justify-between">
          <h3 className="m-0 text-[15px] font-semibold text-[#1d2a43]">Recent Vendor Payments</h3>
          <div className="flex h-8 min-w-[260px] items-center gap-2 rounded-full border border-[#e6ecf7] bg-[#f7f9fd] px-3">
            <FiSearch size={12} className="text-[#8b96ad]" />
            <input
              type="text"
              placeholder="Search vendor or date..."
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              className="w-full border-0 bg-transparent text-[11px] text-[#2b3a59] outline-none placeholder:text-[#9aa6c0]"
            />
          </div>
        </div>

        <div className="overflow-x-auto px-4">
          <table className="w-full min-w-[980px] border-collapse text-[12px]">
            <thead>
              <tr>
                {["VENDOR NAME", "TOTAL EARNINGS", "COMMISSION (15%)", "NET PAYOUT", "STATUS", "ACTIONS"].map((head) => (
                  <th key={head} className="border-b border-[#edf1fa] px-4 py-3 text-left text-[10px] tracking-[0.04em] text-[#7d8ba6]">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedPayments.map((payment, index) => (
                <tr key={`${payment.vendorName}-${index}`} className={index % 2 === 1 ? "bg-[#fbfcff]" : ""}>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="grid h-7 w-7 place-items-center rounded-full bg-[#edf2fb] text-[10px] font-semibold text-[#3f4f70]">
                        {payment.vendorCode}
                      </div>
                      <span className="text-[12px] text-[#1f2d46]">{payment.vendorName}</span>
                    </div>
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-3 text-[#2f3f60]">{payment.totalEarnings}</td>
                  <td className="border-b border-[#edf1fa] px-4 py-3 text-[#8b96ad]">{payment.commission}</td>
                  <td className="border-b border-[#edf1fa] px-4 py-3 font-semibold text-[#1f3d8f]">{payment.netPayout}</td>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${payoutStatusClass(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <button
                      type="button"
                      className="text-[#60749d]"
                      aria-label={`View ${payment.vendorName}`}
                      onClick={() => setDetailsPayment(payment)}
                    >
                      <FiEye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="flex items-center justify-between px-4 py-3 text-[10px] text-[#8b96ad]">
          <span>
            Showing {filteredPayments.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredPayments.length)} of {filteredPayments.length} results
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className={`grid h-6 w-6 place-items-center rounded border border-[#e6ecf7] text-[11px] ${
                page === 1 ? "text-[#94a3b8] opacity-60" : "text-[#64748b]"
              }`}
              aria-disabled={page === 1}
            >
              <FiChevronLeft size={12} />
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className={`grid h-6 w-6 place-items-center rounded border border-[#e6ecf7] text-[11px] ${
                page === totalPages ? "text-[#94a3b8] opacity-60" : "text-[#64748b]"
              }`}
              aria-disabled={page === totalPages}
            >
              <FiChevronRight size={12} />
            </button>
          </div>
        </footer>
      </section>
      {detailsPayment &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40 bg-[#0f172a]/35"
              onClick={() => setDetailsPayment(null)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
              <div className="w-full max-w-[980px] overflow-y-auto rounded-3xl border border-[#e6ecf7] bg-[#f8fafc] shadow-2xl">
                <header className="flex items-start justify-between border-b border-[#e6ecf7] bg-white px-6 py-5">
                  <div>
                    <h3 className="m-0 text-[16px] font-semibold text-[#1d2a43]">Billing Details</h3>
                    <p className="m-0 mt-1 text-[11px] text-[#7d8ba6]">
                      Detailed overview for current billing cycle and provider standing.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadInvoice}
                      disabled={billingActionLoading === "download"}
                      className="inline-flex items-center gap-2 rounded-full border border-[#e6ecf7] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#1f3d8f] disabled:opacity-60"
                    >
                      <FiDownload size={12} />
                      {billingActionLoading === "download" ? "Downloading..." : "Download Invoice"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBillingAction("sendReminder")}
                      disabled={billingActionLoading === "reminder"}
                      className="inline-flex items-center gap-2 rounded-full border border-[#fde68a] bg-[#fffbeb] px-3 py-1.5 text-[10px] font-semibold text-[#b45309] disabled:opacity-60"
                    >
                      <FiSend size={12} />
                      {billingActionLoading === "reminder" ? "Sending..." : "Send Reminder"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBillingAction("markPaid")}
                      disabled={billingActionLoading === "paid"}
                      className="inline-flex items-center gap-2 rounded-full bg-[#1f3d8f] px-3 py-1.5 text-[10px] font-semibold text-white disabled:opacity-60"
                    >
                      <FiCheckCircle size={12} />
                      {billingActionLoading === "paid" ? "Marking..." : "Mark as Paid"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailsPayment(null)}
                      className="text-[#94a3b8]"
                      aria-label="Close billing details"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                </header>

                <div className="space-y-4 px-6 py-5">
                  <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                    <div className="rounded-2xl border border-[#e6ecf7] bg-white p-4">
                      <div className="flex items-start gap-3">
                        <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1f3d8f] to-[#60a5fa]">
                          {detailsPayment.details?.profile?.image && (
                            <Image
                              src={detailsPayment.details.profile.image}
                              alt={detailsPayment.vendorName}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="m-0 text-[9px] font-semibold text-[#ef4444]">OVERDUE</p>
                              <h4 className="m-0 text-[14px] font-semibold text-[#1f2d46]">
                                {detailsPayment.details?.profile?.vendorTitle ?? detailsPayment.vendorName}
                              </h4>
                            </div>
                            <button className="text-[10px] text-[#1f3d8f]">View Provider Profile</button>
                          </div>
                          <p className="m-0 mt-1 text-[10px] text-[#94a3b8]">
                            {detailsPayment.details?.profile?.location ?? "Main Branch | Florida"}
                          </p>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-[9px] text-[#64748b]">
                            <div>
                              <p className="m-0 text-[8px] text-[#94a3b8]">CATEGORY</p>
                              <p className="m-0 font-semibold text-[#1f2d46]">
                                {detailsPayment.details?.profile?.category ?? "Hotel & Resort"}
                              </p>
                            </div>
                            <div>
                              <p className="m-0 text-[8px] text-[#94a3b8]">JOINED DATE</p>
                              <p className="m-0 font-semibold text-[#1f2d46]">
                                {detailsPayment.details?.profile?.joinedDate ?? "Jan 12, 2026"}
                              </p>
                            </div>
                            <div>
                              <p className="m-0 text-[8px] text-[#94a3b8]">LAST BILLING</p>
                              <p className="m-0 font-semibold text-[#1f2d46]">
                                {detailsPayment.details?.profile?.lastBillingDate ?? "Feb 01, 2026"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[#1f3d8f] bg-[#1f3d8f] p-4 text-white">
                      <p className="m-0 text-[10px] text-white/70">Net Payable Amount</p>
                      <p className="m-0 mt-2 text-[20px] font-semibold">
                        {detailsPayment.details?.netPayable?.amount ?? detailsPayment.netPayout}
                      </p>
                      <div className="mt-3 text-[9px] text-white/70">
                        <p className="m-0">
                          Due Date: {detailsPayment.details?.netPayable?.dueDate ?? "Jun 15, 2026"}
                        </p>
                        <p className="m-0">
                          Invoice Status: {detailsPayment.details?.netPayable?.invoiceStatus ?? detailsPayment.status}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-[#e6ecf7] bg-white p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="m-0 text-[12px] font-semibold text-[#1f2d46]">
                        Financial Breakdown
                      </h4>
                      <span className="text-[9px] text-[#94a3b8]">
                        Cycle: {detailsPayment.details?.financialBreakdown?.cycle ?? "Oct 01 - Oct 31, 2025"}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <p className="m-0 text-[9px] text-[#94a3b8]">Total Booking Revenue</p>
                        <p className="m-0 mt-1 text-[12px] font-semibold text-[#1f2d46]">
                          {detailsPayment.details?.financialBreakdown?.totalRevenue ?? detailsPayment.totalEarnings}
                        </p>
                        <div className="mt-2 h-0.5 w-full bg-[#1f3d8f]" />
                      </div>
                      <div>
                        <p className="m-0 text-[9px] text-[#94a3b8]">Commission Rate</p>
                        <p className="m-0 mt-1 text-[12px] font-semibold text-[#1f2d46]">
                          {detailsPayment.details?.financialBreakdown?.commissionRate ?? "10.0%"}
                        </p>
                        <div className="mt-2 h-0.5 w-full bg-[#f59e0b]" />
                      </div>
                      <div>
                        <p className="m-0 text-[9px] text-[#94a3b8]">Commission Amount</p>
                        <p className="m-0 mt-1 text-[12px] font-semibold text-[#ef4444]">
                          {detailsPayment.details?.financialBreakdown?.commissionAmount ?? detailsPayment.commission}
                        </p>
                        <div className="mt-2 h-0.5 w-full bg-[#ef4444]" />
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl border border-[#edf1fa] bg-[#f8fafc] p-3 text-[10px] text-[#64748b]">
                      <p className="m-0">Calculation Summary</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span>Net Payable = (Total Revenue - Commission)</span>
                        <span className="text-[16px] font-semibold text-[#1f3d8f]">
                          {detailsPayment.details?.netPayable?.amount ?? detailsPayment.netPayout}
                        </span>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-[#e6ecf7] bg-white p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="m-0 text-[12px] font-semibold text-[#1f2d46]">Payment History</h4>
                      <button className="text-[10px] text-[#1f3d8f]">View All History</button>
                    </div>
                    <div className="mt-3 rounded-xl border border-[#edf1fa]">
                      {(detailsPayment.details?.history ?? [
                        { id: "TXN-9021-X9", date: "Sep 01, 2026", amount: "$4,210.00", status: "PAID" },
                        { id: "TXN-8842-M2", date: "Aug 01, 2026", amount: "$3,950.00", status: "PAID" },
                        { id: "TXN-7731-L1", date: "Jul 01, 2026", amount: "$5,120.00", status: "PENDING" }
                      ]).map((row) => (
                        <div
                          key={row.id}
                          className="flex items-center justify-between border-b border-[#edf1fa] px-3 py-2 text-[10px] text-[#64748b] last:border-b-0"
                        >
                          <span className="font-semibold text-[#1f2d46]">{row.id}</span>
                          <span>{row.date}</span>
                          <span>{row.amount}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                              row.status === "PAID"
                                ? "bg-[#dcfce7] text-[#15803d]"
                                : "bg-[#fef3c7] text-[#b45309]"
                            }`}
                          >
                            {row.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}
    </section>
  );
}
