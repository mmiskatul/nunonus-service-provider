"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type QueueType = "PHOTO" | "MENU" | "INFO";
type ApprovalState = "pending" | "approved" | "rejected";

type ModerationItem = {
  id: string;
  title: string;
  age: string;
  subtitle: string;
  venue: string;
  location: string;
  vendorId: string;
  queueType: QueueType;
  previewImage: string;
  state: ApprovalState;
};

function queueClass(type: QueueType) {
  if (type === "MENU") return "bg-[#eef2ff] text-[#1f3d8f]";
  if (type === "INFO") return "bg-[#eff6ff] text-[#0f766e]";
  return "bg-[#eef2ff] text-[#1f3d8f]";
}

function statusDot(state: ApprovalState) {
  if (state === "approved") return "bg-[#16a34a]";
  if (state === "rejected") return "bg-[#ef4444]";
  return "bg-[#f59e0b]";
}

export function ContentManagementView({ data }: { data: { totalSubmissions: number; items: ModerationItem[] } }) {
  const [items, setItems] = useState<ModerationItem[]>(data.items);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const selectedItem = useMemo(() => items.find((item) => item.id === selectedItemId) ?? null, [items, selectedItemId]);

  const summaryCards = useMemo(() => {
    const pending = items.filter((item) => item.state === "pending").length;
    const approved = items.filter((item) => item.state === "approved").length;
    const rejected = items.filter((item) => item.state === "rejected").length;
    return [
      { label: "TOTAL SUBMISSIONS", value: data.totalSubmissions.toLocaleString(), tone: "text-[#1f3d8f]" },
      { label: "PENDING REVIEW", value: pending.toLocaleString(), tone: "text-[#1f3d8f]" },
      { label: "APPROVED TODAY", value: approved.toLocaleString(), tone: "text-[#16a34a]" },
      { label: "REJECTED TODAY", value: rejected.toLocaleString(), tone: "text-[#e11d48]" }
    ];
  }, [items]);

  const setItemState = (id: string, nextState: ApprovalState) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, state: nextState } : item)));
  };

  return (
    <section className="relative rounded-md border border-[#dbe2ef] bg-white">
      <div className="space-y-4 bg-[#f7f9fd] p-4">
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          {summaryCards.map((card, i) => (
            <article key={card.label} className="rounded-md border border-[#e6ecf7] bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="m-0 text-[10px] text-[#7d8ba6]">{card.label}</p>
                <div className="grid h-6 w-6 place-items-center rounded bg-[#edf2fb] text-[#1f3d8f]">
                  <span className="text-[10px]">{i + 1}</span>
                </div>
              </div>
              <h3 className={`m-0 text-[30px] leading-none ${card.tone}`}>{card.value}</h3>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-md border border-[#dbe2ef] bg-white">
              <div className="relative h-[96px] w-full bg-[#f3f5f9]">
                <Image src={item.previewImage} alt={item.title} fill className="object-cover" />
                <span className={`absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[8px] font-semibold ${queueClass(item.queueType)}`}>
                  {item.queueType}
                </span>
              </div>
              <div className="space-y-2 p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="m-0 text-[11px] font-semibold text-[#1d2a43]">{item.title}</h4>
                  <span className="text-[9px] text-[#95a2b8]">{item.age}</span>
                </div>
                <p className="m-0 text-[10px] text-[#8b96ad]">{item.subtitle}</p>
                <div className="flex items-center justify-between border-t border-[#edf1fa] pt-2">
                  <div className="flex items-center gap-2">
                    <button type="button" className="text-[#16a34a]" onClick={() => setItemState(item.id, "approved")} aria-label={`Approve ${item.title}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="m5 12 4 4 10-10" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </button>
                    <button type="button" className="text-[#ef4444]" onClick={() => setItemState(item.id, "rejected")} aria-label={`Reject ${item.title}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M6 18 18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </button>
                  </div>
                  <button type="button" onClick={() => setSelectedItemId(item.id)} className="text-[10px] font-semibold text-[#1f3d8f]">
                    DETAILS
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>

      <div
        className={`absolute inset-0 z-20 ${selectedItem ? "pointer-events-auto" : "pointer-events-none"}`}
        onClick={() => setSelectedItemId(null)}
        aria-hidden
      />

      <aside
        className={`absolute right-0 top-0 z-30 h-full w-full max-w-[286px] border-l border-[#dbe2ef] bg-[#f6f8fc] transition-transform duration-300 ${
          selectedItem ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedItem && (
          <div className="flex h-full flex-col overflow-hidden">
            <header className="flex items-center justify-between bg-[#1f3d8f] px-3 py-3 text-white">
              <div>
                <h4 className="m-0 text-[11px] font-semibold">Review Details</h4>
                <p className="m-0 text-[8px] opacity-80">Submission ID: {selectedItem.id}</p>
              </div>
              <button type="button" onClick={() => setSelectedItemId(null)} className="grid h-6 w-6 place-items-center rounded border border-dashed border-[#8cb2f7] text-white">
                x
              </button>
            </header>

            <div className="px-3 py-4">
              <div className="relative h-[184px] overflow-hidden rounded-md bg-[#dfe7f5]">
                <Image src={selectedItem.previewImage} alt={selectedItem.title} fill className="object-cover" />
              </div>

              <div className="mt-4 space-y-3">
                <section>
                  <h5 className="m-0 text-[9px] tracking-[0.08em] text-[#8b96ad] uppercase">Business Info</h5>
                  <div className="mt-2 rounded bg-[#eef2f8] px-3 py-2">
                    <h6 className="m-0 text-[14px] font-semibold text-[#1f3d8f]">{selectedItem.venue}</h6>
                    <p className="m-0 text-[10px] text-[#7184a4]">{selectedItem.location}</p>
                    <p className="m-0 text-[10px] text-[#7184a4]">Vendor ID: {selectedItem.vendorId}</p>
                  </div>
                </section>

                <section>
                  <h5 className="m-0 text-[9px] tracking-[0.08em] text-[#8b96ad] uppercase">Status</h5>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-[#60718f]">
                    <span className={`h-2.5 w-2.5 rounded-full ${statusDot(selectedItem.state)}`} />
                    {selectedItem.state.toUpperCase()}
                  </div>
                </section>
              </div>
            </div>

            <div className="mt-auto border-t border-[#e6ecf7] p-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="h-10 rounded-md bg-[#fdecec] text-[12px] font-semibold text-[#dc2626]"
                  onClick={() => setItemState(selectedItem.id, "rejected")}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="h-10 rounded-md bg-[#1f3d8f] text-[12px] font-semibold text-white"
                  onClick={() => setItemState(selectedItem.id, "approved")}
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </section>
  );
}
