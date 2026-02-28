"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaCheckCircle, FaRegCreditCard, FaShoppingCart } from "react-icons/fa";
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiCalendar,
  FiClock,
  FiEdit2,
  FiFilter,
  FiMoreVertical,
  FiPauseCircle,
  FiPlus,
  FiX,
  FiTrash2,
  FiSearch,
  FiTag,
  FiEye,
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
  const [offers, setOffers] = useState<Offer[]>(data.offers);
  const [discountFilter, setDiscountFilter] = useState<"ALL" | "PERCENT" | "FLAT" | "BOGO">("ALL");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [applyMenuOpen, setApplyMenuOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const [formName, setFormName] = useState("");
  const [formDiscountType, setFormDiscountType] = useState<"PERCENT" | "FLAT">("PERCENT");
  const [formDiscountValue, setFormDiscountValue] = useState(0);
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formApplyTo, setFormApplyTo] = useState("All Vendors");
  const [formActive, setFormActive] = useState(true);
  const [createSaving, setCreateSaving] = useState(false);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-offer-menu]") || target?.closest("[data-offer-menu-panel]")) return;
      if (target?.closest("[data-offer-filter]")) return;
      if (target?.closest("[data-offer-create]")) return;
      if (target?.closest("[data-offer-apply]")) return;
      setOpenMenuId(null);
      setFilterMenuOpen(false);
      setApplyMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  useEffect(() => {
    if (!openMenuId) return;

    const updatePlacement = () => {
      const root = document.querySelector(
        `[data-offer-menu-id="${openMenuId}"]`
      ) as HTMLElement | null;
      const button = root?.querySelector("[data-offer-menu-button]") as HTMLElement | null;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const panelRect = menuPanelRef.current?.getBoundingClientRect();
      const panelHeight = panelRect?.height ?? 0;
      const panelWidth = 160;
      const offset = 8;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const placeTop = spaceBelow < panelHeight + offset && spaceAbove > spaceBelow;
      const top = placeTop ? rect.top - panelHeight - offset : rect.bottom + offset;
      const left = Math.min(
        window.innerWidth - offset - panelWidth,
        Math.max(offset, rect.right - panelWidth)
      );

      setMenuPosition({ top, left });
    };

    const raf = window.requestAnimationFrame(updatePlacement);
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [openMenuId]);

  const filteredOffers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const base = normalizedQuery
      ? offers.filter((offer) => offer.name.toLowerCase().includes(normalizedQuery))
      : offers;
    if (discountFilter === "ALL") return base;
    return base.filter((offer) => offer.kind === discountFilter);
  }, [offers, query, discountFilter]);

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

  const resetCreateForm = () => {
    setFormName("");
    setFormDiscountType("PERCENT");
    setFormDiscountValue(0);
    setFormStartDate("");
    setFormEndDate("");
    setFormApplyTo("All Vendors");
    setFormActive(true);
    setApplyMenuOpen(false);
  };

  const handleCreateOffer = async () => {
    if (!formName.trim() || createSaving) return;
    setCreateSaving(true);
    try {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          discountType: formDiscountType,
          discountValue: formDiscountValue,
          startDate: formStartDate,
          endDate: formEndDate,
          appliedTo: formApplyTo,
          active: formActive
        })
      });
      if (!response.ok) throw new Error("Failed to create offer");
      const payload = (await response.json()) as { offer: Offer; offers: Offer[] };
      if (payload?.offers?.length) {
        setOffers(payload.offers);
      } else if (payload?.offer) {
        setOffers((prev) => [payload.offer, ...prev]);
      }
      setCreateOpen(false);
      resetCreateForm();
      setPage(1);
    } finally {
      setCreateSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <section className="flex flex-col gap-3 rounded-2xl border border-[#e6ecf7] bg-gray-200 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="m-0 text-xl font-semibold text-[#1d2a43]">Offers</h2>
          <p className="m-0 mt-1 text-base text-[#2b3a59]">
            Manage and monitor promotional campaign performance across all regions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[#1f3d8f] px-4 py-3 text-[12px] font-semibold text-white shadow-md shadow-[#1f3d8f]/20"
        >
          <span className="grid size-5  place-items-center rounded-full bg-white/15">
            <FiPlus size={10} />
          </span>
          Create Offer
        </button>
      </section>
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
            <div className="relative" data-offer-filter>
              <button
                type="button"
                onClick={() => setFilterMenuOpen((current) => !current)}
                className={`relative inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] ${
                  discountFilter !== "ALL"
                    ? "border-[#c7d2fe] bg-[#eef2ff] text-[#1f3d8f]"
                    : "border-[#e6ecf7] bg-white text-[#3a4b70]"
                }`}
              >
                <FiFilter size={12} />
                Filter
                {discountFilter !== "ALL" && (
                  <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#1f3d8f] px-1 text-[9px] font-semibold text-white">
                    1
                  </span>
                )}
              </button>
              {filterMenuOpen && (
                <div className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-lg border border-[#e6ecf7] bg-white shadow-lg">
                  {[
                    { value: "ALL", label: "All Discounts" },
                    { value: "PERCENT", label: "Percent" },
                    { value: "FLAT", label: "Flat" },
                    { value: "BOGO", label: "BOGO" }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setDiscountFilter(option.value as typeof discountFilter);
                        setPage(1);
                        setFilterMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-[11px] hover:bg-[#f8fafc] ${
                        discountFilter === option.value ? "text-[#1f3d8f]" : "text-[#475569]"
                      }`}
                    >
                      {option.label}
                      {discountFilter === option.value && <span className="text-[10px]">Active</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
                    <div className="relative" data-offer-menu data-offer-menu-id={offer.id}>
                      <button
                        type="button"
                        className="grid h-7 w-7 place-items-center rounded-full bg-[#eef2ff] text-[#1f3d8f]"
                        aria-label={`Open actions for ${offer.name}`}
                        onClick={() =>
                          setOpenMenuId((current) => (current === offer.id ? null : offer.id))
                        }
                        data-offer-menu-button
                      >
                        <FiMoreVertical size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {openMenuId && menuPosition &&
          createPortal(
            <div
              ref={menuPanelRef}
              data-offer-menu-panel
              style={{ top: menuPosition.top, left: menuPosition.left }}
              className="fixed z-50 w-40 overflow-hidden rounded-lg border border-[#e6ecf7] bg-white shadow-lg"
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-[#475569] hover:bg-[#f8fafc]"
              >
                <FiEye size={13} />
                View Details
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-[#475569] hover:bg-[#f8fafc]"
              >
                <FiEdit2 size={13} />
                Edit Offer
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-[#1f3d8f] hover:bg-[#f8fafc]"
              >
                <FiPauseCircle size={13} />
                Pause Campaign
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-[#ef4444] hover:bg-[#fef2f2]"
              >
                <FiTrash2 size={13} />
                Delete
              </button>
            </div>,
            document.body
          )}
        {createOpen &&
          createPortal(
            <>
              <div
                className="fixed inset-0 z-40 bg-[#0f172a]/30"
                onClick={() => {
                  setCreateOpen(false);
                  resetCreateForm();
                }}
              />
              <aside
                className="fixed inset-y-0 right-0 z-50 w-full max-w-[420px] overflow-y-auto bg-white shadow-2xl"
                data-offer-create
              >
                <header className="flex items-center justify-between border-b border-[#edf1fa] px-5 py-4">
                  <h3 className="m-0 text-[16px] font-semibold text-[#1d2a43]">Create New Offer</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setCreateOpen(false);
                      resetCreateForm();
                    }}
                    className="text-[#94a3b8]"
                    aria-label="Close create offer"
                  >
                    <FiX size={16} />
                  </button>
                </header>
                <form
                  className="space-y-4 px-5 py-4 text-[11px] text-[#475569]"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleCreateOffer();
                  }}
                >
                  <div>
                    <label className="text-[11px] font-semibold text-[#334155]">Offer Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Winter Holiday Special"
                      value={formName}
                      onChange={(event) => setFormName(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#e6ecf7] bg-[#f8fafc] px-3 py-2 text-[11px] text-[#1f2d46] placeholder:text-[#94a3b8] outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold text-[#334155]">Discount Type</label>
                      <div className="mt-2 flex items-center rounded-xl border border-[#e6ecf7] bg-[#f8fafc] p-1">
                        <button
                          type="button"
                          onClick={() => setFormDiscountType("PERCENT")}
                          className={`flex-1 rounded-lg px-3 py-2 text-[10px] font-semibold ${
                            formDiscountType === "PERCENT"
                              ? "bg-white text-[#1f3d8f] shadow-sm"
                              : "text-[#64748b]"
                          }`}
                        >
                          Percentage
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormDiscountType("FLAT")}
                          className={`flex-1 rounded-lg px-3 py-2 text-[10px] font-semibold ${
                            formDiscountType === "FLAT"
                              ? "bg-white text-[#1f3d8f] shadow-sm"
                              : "text-[#64748b]"
                          }`}
                        >
                          Flat Amount
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#334155]">Discount Value</label>
                      <div className="mt-2 flex items-center justify-between rounded-xl border border-[#e6ecf7] bg-[#f8fafc] px-3 py-2">
                        <input
                          type="number"
                          value={formDiscountValue}
                          onChange={(event) => setFormDiscountValue(Number(event.target.value))}
                          className="w-full border-0 bg-transparent text-[11px] text-[#1f2d46] outline-none"
                        />
                        <span className="text-[11px] text-[#94a3b8]">
                          {formDiscountType === "PERCENT" ? "%" : "$"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold text-[#334155]">Start Date</label>
                      <div className="mt-2 flex items-center justify-between rounded-xl border border-[#e6ecf7] bg-[#f8fafc] px-3 py-2">
                        <input
                          type="date"
                          value={formStartDate}
                          onChange={(event) => setFormStartDate(event.target.value)}
                          className="w-full border-0 bg-transparent text-[11px] text-[#1f2d46] outline-none"
                        />
                        <FiCalendar size={12} className="text-[#94a3b8]" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#334155]">End Date</label>
                      <div className="mt-2 flex items-center justify-between rounded-xl border border-[#e6ecf7] bg-[#f8fafc] px-3 py-2">
                        <input
                          type="date"
                          value={formEndDate}
                          onChange={(event) => setFormEndDate(event.target.value)}
                          className="w-full border-0 bg-transparent text-[11px] text-[#1f2d46] outline-none"
                        />
                        <FiCalendar size={12} className="text-[#94a3b8]" />
                      </div>
                    </div>
                  </div>
                  <div data-offer-apply>
                    <label className="text-[11px] font-semibold text-[#334155]">Apply To</label>
                    <button
                      type="button"
                      onClick={() => setApplyMenuOpen((current) => !current)}
                      className="mt-2 flex w-full items-center justify-between rounded-xl border border-[#e6ecf7] bg-[#f8fafc] px-3 py-2"
                    >
                      <span className="text-[11px] text-[#1f2d46]">{formApplyTo}</span>
                      <FiChevronDown size={12} className="text-[#94a3b8]" />
                    </button>
                    {applyMenuOpen && (
                      <div className="mt-2 overflow-hidden rounded-xl border border-[#e6ecf7] bg-white shadow-sm">
                        {["All Vendors", "Selected Vendors", "Platform Wide"].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setFormApplyTo(option);
                              setApplyMenuOpen(false);
                            }}
                            className={`flex w-full items-center justify-between px-3 py-2 text-left text-[11px] hover:bg-[#f8fafc] ${
                              formApplyTo === option ? "text-[#1f3d8f]" : "text-[#475569]"
                            }`}
                          >
                            {option}
                            {formApplyTo === option && <span className="text-[10px]">Active</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-[#e6ecf7] bg-[#f8fafc] px-3 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="m-0 text-[11px] font-semibold text-[#1f2d46]">Active Status</p>
                        <p className="m-0 mt-1 text-[10px] text-[#94a3b8]">
                          Enable this offer immediately upon creation
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormActive((current) => !current)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full ${
                          formActive ? "bg-[#1f3d8f]" : "bg-[#cbd5f5]"
                        }`}
                        aria-pressed={formActive}
                      >
                        <span
                          className={`h-4 w-4 rounded-full bg-white transition-transform ${
                            formActive ? "translate-x-4" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCreateOpen(false);
                        resetCreateForm();
                      }}
                      className="flex-1 rounded-full border border-[#e6ecf7] bg-white px-4 py-2 text-[11px] font-semibold text-[#1f2d46]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!formName.trim() || createSaving}
                      className="flex-[1.2] rounded-full bg-[#1f3d8f] px-4 py-2 text-[11px] font-semibold text-white shadow-md shadow-[#1f3d8f]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {createSaving ? "Creating..." : "Create Offer"}
                    </button>
                  </div>
                </form>
              </aside>
            </>,
            document.body
          )}

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
