"use client"

type OfferStatus = "Active" | "Inactive";
type DiscountKind = "PERCENT" | "FLAT" | "BOGO";

type Offer = {
  id: string;
  name: string;
  discount: string;
  validity: string;
  appliedTo: string;
  status: OfferStatus;
  redemptions: number;
  kind: DiscountKind;
};

function offerStatusClass(status: OfferStatus) {
  if (status === "Active") return "bg-[#dcfce7] text-[#15803d]";
  return "bg-[#e2e8f0] text-[#64748b]";
}

function offerKindIcon(kind: DiscountKind) {
  if (kind === "FLAT") return "âš¡";
  if (kind === "BOGO") return "ðŸŽ";
  return "ðŸ·ï¸";
}

export function OffersManagementView({ data }: { data: { summaryCards: Array<{ label: string; value: string; note: string; tone: string }>; offers: Offer[] } }) {
  return (
    <section className="space-y-4 rounded-md border border-[#dbe2ef] bg-[#f7f9fd] p-4">
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        {data.summaryCards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-[#e6ecf7] bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#edf2fb] text-[#1f3d8f]">
                <span className="text-xs">â—</span>
              </div>
              <span className={`text-[10px] font-semibold ${card.tone}`}>{card.note}</span>
            </div>
            <p className="m-0 text-[10px] tracking-[0.04em] text-[#7d8ba6]">{card.label}</p>
            <h3 className="m-0 mt-1 text-[34px] leading-none text-[#1d2a43]">{card.value}</h3>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#dbe2ef] bg-white">
        <div className="flex flex-col gap-2 border-b border-[#e6ecf7] p-3 md:flex-row md:items-center md:justify-between">
          <h3 className="m-0 text-[18px] font-semibold text-[#1d2a43]">Offer Listings</h3>
          <div className="flex items-center gap-2">
            <div className="flex h-8 min-w-[220px] items-center gap-2 rounded-full border border-[#e6ecf7] bg-[#f7f9fd] px-3">
              <span className="text-[10px] text-[#8b96ad]">Q</span>
              <input
                type="text"
                placeholder="Search offers..."
                className="w-full border-0 bg-transparent text-[11px] text-[#2b3a59] outline-none placeholder:text-[#9aa6c0]"
              />
            </div>
            <button type="button" className="h-8 rounded-full border border-[#e6ecf7] bg-white px-3 text-[11px] text-[#3a4b70]">
              Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-[12px]">
            <thead>
              <tr>
                {["OFFER NAME", "DISCOUNT", "VALIDITY PERIOD", "APPLIED TO", "STATUS", "REDEMPTIONS", "ACTIONS"].map((head) => (
                  <th key={head} className="border-b border-[#edf1fa] px-4 py-3 text-left text-[10px] tracking-[0.04em] text-[#7d8ba6]">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.offers.map((offer, index) => (
                <tr key={offer.id} className={index % 2 === 1 ? "bg-[#fbfcff]" : ""}>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-6 w-6 place-items-center rounded-full bg-[#edf2fb] text-[11px]">
                        {offerKindIcon(offer.kind)}
                      </div>
                      <span className="text-[13px] font-semibold text-[#1f2d46]">{offer.name}</span>
                    </div>
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-3 text-[#2f3f60]">{offer.discount}</td>
                  <td className="border-b border-[#edf1fa] px-4 py-3 text-[#7d8ba6]">{offer.validity}</td>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <span className="rounded bg-[#f1f5f9] px-2 py-1 text-[9px] text-[#64748b]">{offer.appliedTo}</span>
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${offerStatusClass(offer.status)}`}>
                      {offer.status}
                    </span>
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-3 text-[#2f3f60]">{offer.redemptions.toLocaleString()}</td>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <div className="flex items-center gap-3 text-sm">
                      <button type="button" className="text-[#294f99]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M1.5 12s3.7-6.5 10.5-6.5S22.5 12 22.5 12s-3.7 6.5-10.5 6.5S1.5 12 1.5 12Z" stroke="currentColor" strokeWidth="1.8" />
                          <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
                        </svg>
                      </button>
                      <button type="button" className="text-[#ef4444]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                          <path d="M8 16L16 8" stroke="currentColor" strokeWidth="1.8" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="flex items-center justify-between px-4 py-3 text-[10px] text-[#8b96ad]">
          <span>Showing 1 to {data.offers.length} of 124 offers</span>
          <div className="flex items-center gap-2">
            <button type="button" className="grid h-6 w-6 place-items-center rounded-full border border-[#e6ecf7] text-[#95a2b8]">â€¹</button>
            <button type="button" className="grid h-6 w-6 place-items-center rounded-full bg-[#1f3d8f] text-white">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button" className="grid h-6 w-6 place-items-center rounded-full border border-[#e6ecf7] text-[#95a2b8]">â€º</button>
          </div>
        </footer>
      </section>
    </section>
  );
}


