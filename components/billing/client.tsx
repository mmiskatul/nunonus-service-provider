"use client"

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

export function BillingManagementView({ data }: { data: { summaryCards: Array<{ label: string; value: string; note: string; tone: string }>; recentPayments: PaymentRow[] } }) {
  return (
    <section className="space-y-4 rounded-md border border-[#dbe2ef] bg-[#f7f9fd] p-4">
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        {data.summaryCards.map((card, i) => (
          <article key={card.label} className="rounded-2xl border border-[#e6ecf7] bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#edf2fb] text-[#1f3d8f]">
                <span className="text-xs">{i === 0 ? "◧" : i === 1 ? "%" : i === 2 ? "◫" : "◉"}</span>
              </div>
              <span className={`text-[10px] font-semibold ${card.tone}`}>{card.note}</span>
            </div>
            <p className="m-0 text-[10px] text-[#7d8ba6]">{card.label}</p>
            <h3 className="m-0 mt-1 text-[34px] leading-none text-[#1d2a43]">{card.value}</h3>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#dbe2ef] bg-white">
        <div className="flex flex-col gap-2 border-b border-[#e6ecf7] p-3 md:flex-row md:items-center md:justify-between">
          <h3 className="m-0 text-[18px] font-semibold text-[#1d2a43]">Recent Vendor Payments</h3>
          <div className="flex h-8 min-w-[250px] items-center gap-2 rounded-full border border-[#e6ecf7] bg-[#f7f9fd] px-3">
            <span className="text-[10px] text-[#8b96ad]">Q</span>
            <input
              type="text"
              placeholder="Search vendor or date..."
              className="w-full border-0 bg-transparent text-[11px] text-[#2b3a59] outline-none placeholder:text-[#9aa6c0]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
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
              {data.recentPayments.map((payment, index) => (
                <tr key={payment.vendorName} className={index % 2 === 1 ? "bg-[#fbfcff]" : ""}>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="grid h-6 w-6 place-items-center rounded-full bg-[#edf2fb] text-[9px] font-semibold text-[#3f4f70]">
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
                    <button type="button" className="text-[#60749d]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M1.5 12s3.7-6.5 10.5-6.5S22.5 12 22.5 12s-3.7 6.5-10.5 6.5S1.5 12 1.5 12Z" stroke="currentColor" strokeWidth="1.8" />
                        <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="flex items-center justify-between px-4 py-3 text-[10px] text-[#8b96ad]">
          <span>Showing 3 of 124 results</span>
          <div className="flex items-center gap-2">
            <button type="button" className="grid h-5 w-5 place-items-center rounded border border-[#e6ecf7] text-[#95a2b8]">‹</button>
            <button type="button" className="grid h-5 w-5 place-items-center rounded border border-[#e6ecf7] text-[#95a2b8]">›</button>
          </div>
        </footer>
      </section>
    </section>
  );
}


