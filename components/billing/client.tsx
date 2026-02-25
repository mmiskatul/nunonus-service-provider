"use client";

import { useMemo, useState } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiDollarSign,
  FiEye,
  FiPercent,
  FiSearch,
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

  const filteredPayments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return data.recentPayments;
    return data.recentPayments.filter((payment) => {
      return (
        payment.vendorName.toLowerCase().includes(normalizedQuery) ||
        payment.vendorCode.toLowerCase().includes(normalizedQuery) ||
        payment.totalEarnings.toLowerCase().includes(normalizedQuery) ||
        payment.netPayout.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [data.recentPayments, query]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const pagedPayments = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, page]);

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
                    <button type="button" className="text-[#60749d]" aria-label={`View ${payment.vendorName}`}>
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
    </section>
  );
}
