"use client";

import { useMemo, useState } from "react";
import { FaCheckCircle, FaRegCreditCard, FaShoppingCart } from "react-icons/fa";
import {
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiEye,
  FiFilter,
  FiSearch,
  FiTag,
  FiX,
  FiZap,
  FiGift
} from "react-icons/fi";

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
  if (kind === "FLAT") return <FiZap size={12} />;
  if (kind === "BOGO") return <FiGift size={12} />;
  return <FiTag size={12} />;
}

const pageSize = 5;

export function OffersManagementView({
  data
}: {
  data: { summaryCards: Array<{ label: string; value: string; note: string; tone: string }>; offers: Offer[] };
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filteredOffers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return data.offers;
    return data.offers.filter((offer) => offer.name.toLowerCase().includes(normalizedQuery));
  }, [data.offers, query]);

  const totalPages = Math.max(1, Math.ceil(filteredOffers.length / pageSize));
  const pagedOffers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredOffers.slice(start, start + pageSize);
  }, [filteredOffers, page]);

  const paginationItems = useMemo(() => {
    if (totalPages <= 4) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const items: Array<number | "ellipsis"> = [1];

    if (page <= 3) {
      items.push(2, 3, "ellipsis", totalPages);
      return items;
    }

    if (page >= totalPages - 2) {
      items.push("ellipsis", totalPages - 2, totalPages - 1, totalPages);
      return items;
    }

    items.push("ellipsis", page - 1, page, page + 1, "ellipsis", totalPages);
    return items;
  }, [page, totalPages]);

  return (
    <section className="space-y-4">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {data.summaryCards.map((card, index) => (
          <article key={card.label} className="rounded-2xl border border-[#e6ecf7] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#eef2ff] text-[#1f3d8f]">
                {index === 0 && <FaCheckCircle  size={18} />}
                {index === 1 && <FiClock size={18} />}
                {index === 2 && <FaShoppingCart  size={18} />}
                {index === 3 && <FaRegCreditCard size={18} />}
              </div>
              <span className={`text-[10px] font-semibold ${card.tone}`}>{card.note}</span>
            </div>
            <p className="m-0 text-[10px] tracking-[0.04em] text-[#7d8ba6]">{card.label}</p>
            <h3 className="m-0 mt-1 text-[28px] leading-none text-[#1d2a43]">{card.value}</h3>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e6ecf7] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#e6ecf7] px-4 py-3 md:flex-row md:items-center md:justify-between">
          <h3 className="m-0 text-[15px] font-semibold text-[#1d2a43]">Offer Listings</h3>
          <div className="flex items-center gap-2">
            <div className="flex h-8 min-w-[220px] items-center gap-2 rounded-full border border-[#e6ecf7] bg-[#f7f9fd] px-3">
              <FiSearch size={12} className="text-[#8b96ad]" />
              <input
                type="text"
                placeholder="Search offers..."
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                className="w-full border-0 bg-transparent text-[11px] text-[#2b3a59] outline-none placeholder:text-[#9aa6c0]"
              />
            </div>
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#e6ecf7] bg-white px-3 text-[11px] text-[#3a4b70]"
            >
              <FiFilter size={12} />
              Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto px-4">
          <table className="w-full min-w-[980px] border-collapse text-[12px]">
            <thead>
              <tr>
                {[
                  "OFFER NAME",
                  "DISCOUNT",
                  "VALIDITY PERIOD",
                  "APPLIED TO",
                  "STATUS",
                  "REDEMPTIONS",
                  "ACTIONS"
                ].map((head) => (
                  <th
                    key={head}
                    className="border-b border-[#edf1fa] px-4 py-3 text-left text-[10px] tracking-[0.04em] text-[#7d8ba6]"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedOffers.map((offer, index) => (
                <tr key={offer.id} className={index % 2 === 1 ? "bg-[#fbfcff]" : ""}>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-7 w-7 place-items-center rounded-full bg-[#edf2fb] text-[#1f3d8f]">
                        {offerKindIcon(offer.kind)}
                      </div>
                      <span className="text-[13px] font-semibold text-[#1f2d46]">{offer.name}</span>
                    </div>
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-3 text-[#2f3f60]">{offer.discount}</td>
                  <td className="border-b border-[#edf1fa] px-4 py-3 text-[#7d8ba6]">{offer.validity}</td>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <span className="rounded-full bg-[#f1f5f9] px-2 py-1 text-[9px] text-[#64748b]">{offer.appliedTo}</span>
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${offerStatusClass(offer.status)}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${offer.status === "Active" ? "bg-[#16a34a]" : "bg-[#94a3b8]"}`} />
                      {offer.status}
                    </span>
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-3 text-[#2f3f60]">{offer.redemptions.toLocaleString()}</td>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <div className="flex items-center gap-3 text-sm">
                      <button type="button" className="text-[#294f99]" aria-label={`View ${offer.name}`}>
                        <FiEye size={14} />
                      </button>
                      <button type="button" className="text-[#ef4444]" aria-label={`Disable ${offer.name}`}>
                        <FiX size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="flex items-center justify-between px-4 py-3 text-[10px] text-[#8b96ad]">
          <span>
            Showing {filteredOffers.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredOffers.length)} of {filteredOffers.length} offers
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className={`grid h-7 w-7 place-items-center rounded-full border border-[#e6ecf7] text-[11px] ${
                page === 1 ? "text-[#94a3b8] opacity-60" : "text-[#64748b]"
              }`}
              aria-disabled={page === 1}
            >
              <FiChevronLeft />
            </button>
            {paginationItems.map((item, index) => {
              if (item === "ellipsis") {
                return (
                  <span key={`ellipsis-${index}`} className="px-1 text-[#a1aac0]">
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  className={`grid h-7 w-7 place-items-center rounded-full text-[11px] ${
                    item === page ? "bg-[#1f3d8f] text-white" : "text-[#64748b]"
                  }`}
                >
                  {item}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className={`grid h-7 w-7 place-items-center rounded-full border border-[#e6ecf7] text-[11px] ${
                page === totalPages ? "text-[#94a3b8] opacity-60" : "text-[#64748b]"
              }`}
              aria-disabled={page === totalPages}
            >
              <FiChevronRight />
            </button>
          </div>
        </footer>
      </section>
    </section>
  );
}
