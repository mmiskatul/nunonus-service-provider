"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type VendorStatus = "PENDING" | "APPROVED" | "REJECTED";
type VendorCategory = "HOSPITALITY" | "DINING" | "RENTALS";

type VerificationDoc = {
  title: string;
  state: "Verified" | "Rejected";
};

type Vendor = {
  id: string;
  businessName: string;
  owner: string;
  category: VendorCategory;
  bookings: number;
  rating: number;
  status: VendorStatus;
  avatar: string;
  verification: {
    description: string;
    address: string;
    reviewScore: number;
    reviewCount: number;
    docs: VerificationDoc[];
  };
};

function vendorStatusClass(status: VendorStatus) {
  if (status === "APPROVED") return "bg-[#dcfce7] text-[#15803d]";
  if (status === "REJECTED") return "bg-[#fee2e2] text-[#dc2626]";
  return "bg-[#fff4cc] text-[#b45309]";
}

function summaryIconColor(i: number) {
  if (i === 1) return "bg-[#fff7e5] text-[#f59e0b]";
  if (i === 2) return "bg-[#e8f8ef] text-[#2da772]";
  if (i === 3) return "bg-[#feeeee] text-[#ef4444]";
  return "bg-[#edf2fb] text-[#1f3d8f]";
}

export function VendorsManagementView({
  data
}: {
  data: { summaryCards: Array<{ label: string; value: string; note: string; tone: string }>; vendors: Vendor[] };
}) {
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  const selectedVendor = useMemo(
    () => data.vendors.find((vendor) => vendor.id === selectedVendorId) ?? null,
    [selectedVendorId, data.vendors]
  );

  return (
    <section className="relative space-y-6">
      <div className="space-y-6">
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {data.summaryCards.map((card, i) => (
            <article key={card.label} className="rounded-xl border border-[#e6ecf7] bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <p className="m-0 text-[11px] text-[#7d8ba6]">{card.label}</p>
                <div className={`grid h-8 w-8 place-items-center rounded-lg ${summaryIconColor(i)}`}>
                  <span className="text-[12px]">â€¢</span>
                </div>
              </div>
              <h3 className="m-0 text-[28px] leading-none text-[#1d2a43]">{card.value}</h3>
              <p className={`m-0 mt-2 text-[11px] ${card.tone}`}>{card.note}</p>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-xl border border-[#e6ecf7] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
            <h3 className="m-0 text-[15px] font-semibold text-[#1d2a43]">Vendor Directory</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-[#e6ecf7] bg-white px-3 text-[11px] text-[#3a4b70]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Filter
              </button>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-[#e6ecf7] bg-white px-3 text-[11px] text-[#3a4b70]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3v12m0 0 4-4m-4 4-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M4 17v3h16v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-[12px]">
              <thead>
                <tr>
                  {[
                    "VENDOR ID",
                    "BUSINESS NAME",
                    "OWNER",
                    "CATEGORY",
                    "BOOKINGS",
                    "RATING",
                    "STATUS",
                    "ACTIONS"
                  ].map((head) => (
                    <th
                      key={head}
                      className="border-b border-[#edf1fa] px-4 py-3 text-left text-[10px] tracking-[0.06em] text-[#7d8ba6]"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.vendors.map((vendor, index) => (
                  <tr key={vendor.id} className={index % 2 === 1 ? "bg-[#fbfcff]" : ""}>
                    <td className="border-b border-[#edf1fa] px-4 py-4 text-[11px] font-semibold text-[#2d3f62]">{vendor.id}</td>
                    <td className="border-b border-[#edf1fa] px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Image
                          src={vendor.avatar}
                          alt={vendor.businessName}
                          width={26}
                          height={26}
                          className="h-7 w-7 rounded object-cover"
                        />
                        <span className="text-[12px] font-semibold text-[#1f2d46]">{vendor.businessName}</span>
                      </div>
                    </td>
                    <td className="border-b border-[#edf1fa] px-4 py-4 text-[#4f5f82]">{vendor.owner}</td>
                    <td className="border-b border-[#edf1fa] px-4 py-4">
                      <span className="rounded bg-[#f1f5f9] px-2 py-1 text-[9px] font-semibold text-[#64748b]">
                        {vendor.category}
                      </span>
                    </td>
                    <td className="border-b border-[#edf1fa] px-4 py-4 text-[#2f3f60]">{vendor.bookings.toLocaleString()}</td>
                    <td className="border-b border-[#edf1fa] px-4 py-4 text-[#f59e0b]">
                      {"?".repeat(5)} <span className="text-[#7d8ba6]">{vendor.rating.toFixed(1)}</span>
                    </td>
                    <td className="border-b border-[#edf1fa] px-4 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${vendorStatusClass(vendor.status)}`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td className="border-b border-[#edf1fa] px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedVendorId(vendor.id)}
                          className="grid h-6 w-6 place-items-center rounded-full border border-[#e6ecf7] text-[#64748b]"
                          aria-label={`Open ${vendor.businessName} verification`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M1.5 12s3.7-6.5 10.5-6.5S22.5 12 22.5 12s-3.7 6.5-10.5 6.5S1.5 12 1.5 12Z" stroke="currentColor" strokeWidth="1.8" />
                            <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
                          </svg>
                        </button>
                        <button type="button" className="grid h-6 w-6 place-items-center rounded-full border border-[#d7f2e3] text-[#16a34a]">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                            <path d="m8 12 2.5 2.5L16 9" stroke="currentColor" strokeWidth="1.8" />
                          </svg>
                        </button>
                        <button type="button" className="grid h-6 w-6 place-items-center rounded-full border border-[#fde2e2] text-[#ef4444]">
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

          <footer className="flex items-center justify-between px-5 py-4 text-[11px] text-[#8b96ad]">
            <span>Showing 1-10 of {data.summaryCards[0].value} vendors</span>
            <div className="flex items-center gap-2">
              <button type="button" className="rounded border border-[#e6ecf7] px-2 py-0.5 text-[10px] text-[#94a3b8]">Previous</button>
              <button type="button" className="h-6 w-6 rounded bg-[#1f3d8f] text-[11px] text-white">1</button>
              <button type="button" className="h-6 w-6 rounded border border-[#e6ecf7] text-[11px] text-[#64748b]">2</button>
              <button type="button" className="h-6 w-6 rounded border border-[#e6ecf7] text-[11px] text-[#64748b]">3</button>
              <button type="button" className="rounded border border-[#e6ecf7] px-2 py-0.5 text-[10px] text-[#64748b]">Next</button>
            </div>
          </footer>
        </section>
      </div>

      <div
        className={`fixed inset-0 z-20 ${selectedVendor ? "pointer-events-auto" : "pointer-events-none"}`}
        onClick={() => setSelectedVendorId(null)}
        aria-hidden
      />

      <aside
        className={`fixed right-0 top-0 z-30 h-full w-full max-w-[320px] border-l border-[#e6ecf7] bg-white shadow-sm transition-transform duration-300 ${
          selectedVendor ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedVendor && (
          <div className="flex h-full flex-col overflow-hidden">
            <header className="flex items-center justify-between bg-[#1f3d8f] px-4 py-3 text-white">
              <h4 className="m-0 text-[12px] font-semibold">Verification Detail</h4>
              <button type="button" onClick={() => setSelectedVendorId(null)} className="text-white">Ã—</button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="flex flex-col items-center">
                <Image src={selectedVendor.avatar} alt={selectedVendor.businessName} width={64} height={48} className="h-12 w-16 rounded object-cover" />
                <h3 className="m-0 mt-3 text-[16px] font-semibold text-[#1d2a43]">{selectedVendor.businessName}</h3>
                <span className="mt-1 rounded-full bg-[#fff3d7] px-2 py-0.5 text-[9px] font-semibold text-[#b45309]">PENDING VERIFICATION</span>
              </div>

              <div className="mt-5 space-y-4">
                <section>
                  <h5 className="m-0 text-[9px] tracking-[0.08em] text-[#8b96ad] uppercase">Description</h5>
                  <p className="m-0 mt-1 text-[10px] leading-[1.45] text-[#60718f]">{selectedVendor.verification.description}</p>
                </section>

                <section>
                  <h5 className="m-0 text-[9px] tracking-[0.08em] text-[#8b96ad] uppercase">Address</h5>
                  <p className="m-0 mt-1 text-[10px] leading-[1.45] text-[#60718f]">{selectedVendor.verification.address}</p>
                </section>

                <section>
                  <h5 className="m-0 text-[9px] tracking-[0.08em] text-[#8b96ad] uppercase">Verification Documents</h5>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {selectedVendor.verification.docs.map((doc) => (
                      <div key={doc.title} className="rounded-lg border border-[#e6ecf7] bg-white p-2">
                        <div className="grid h-9 place-items-center rounded bg-[#f2f5fb] text-[#9aabca]">?</div>
                        <p className="m-0 mt-2 truncate text-[9px] font-semibold text-[#3f4f70]">{doc.title}</p>
                        <p className={`m-0 text-[9px] ${doc.state === "Verified" ? "text-[#16a34a]" : "text-[#ef4444]"}`}>{doc.state}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h5 className="m-0 text-[9px] tracking-[0.08em] text-[#8b96ad] uppercase">Reviews Summary</h5>
                  <div className="mt-1 flex items-end gap-2">
                    <span className="text-[34px] leading-none text-[#1d2a43]">{selectedVendor.verification.reviewScore.toFixed(1)}</span>
                    <span className="mb-1 text-[9px] text-[#8b96ad]">Based on {selectedVendor.verification.reviewCount.toLocaleString()} verified reviews</span>
                  </div>
                </section>
              </div>
            </div>

            <div className="mt-auto border-t border-[#e6ecf7] px-5 py-4">
              <button type="button" className="h-10 w-full rounded-full bg-[#1f3d8f] text-[12px] font-semibold text-white">
                Approve Vendor
              </button>
            </div>
          </div>
        )}
      </aside>
    </section>
  );
}
