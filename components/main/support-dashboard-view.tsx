"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import supportData from "@/data/support.json";

type TicketStatus = "In Progress" | "Open" | "Resolved";
type TicketType = "Account" | "Technical";
type Priority = "High" | "Medium" | "Low";

type ConversationMessage = {
  sender: "agent" | "user";
  text: string;
  time: string;
  name?: string;
};

type SupportTicket = {
  id: string;
  userName: string;
  userRole: "User" | "Vendor";
  avatar: string;
  type: TicketType;
  subject: string;
  status: TicketStatus;
  priority: Priority;
  openedAt: string;
  issueDetails: string;
  conversation: ConversationMessage[];
};

const supportApiResponse = supportData as {
  summaryCards: Array<{ label: string; value: string; note: string; tone: string }>;
  tickets: SupportTicket[];
};

function ticketStatusClass(status: TicketStatus) {
  if (status === "Open") return "bg-[#dbeafe] text-[#1d4ed8]";
  if (status === "Resolved") return "bg-[#dcfce7] text-[#15803d]";
  return "bg-[#fef3c7] text-[#b45309]";
}

function summaryIcon(i: number) {
  if (i === 1) return "bg-[#e6efff] text-[#1f3d8f]";
  if (i === 2) return "bg-[#e8f8ef] text-[#16a34a]";
  if (i === 3) return "bg-[#fee2e2] text-[#dc2626]";
  return "bg-[#ede9fe] text-[#3b1e8a]";
}

export function SupportDashboardView() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const selectedTicket = useMemo(
    () => supportApiResponse.tickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [selectedTicketId]
  );

  return (
    <section className="relative space-y-4 rounded-md border border-[#dbe2ef] bg-[#f7f9fd] p-4">
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        {supportApiResponse.summaryCards.map((card, i) => (
          <article key={card.label} className="rounded-2xl border border-[#e6ecf7] bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className={`grid h-8 w-8 place-items-center rounded-full ${summaryIcon(i)}`}>
                <span className="text-sm">{i === 0 ? "âœ‰" : i === 1 ? "â±" : i === 2 ? "âœ“" : "!"}</span>
              </div>
              <p className="m-0 text-[11px] text-[#7d8ba6]">{card.label}</p>
            </div>
            <h3 className={`m-0 text-[34px] leading-none ${card.tone}`}>{card.value}</h3>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#dbe2ef] bg-white">
        <div className="flex flex-col gap-2 border-b border-[#e6ecf7] p-3 md:flex-row md:items-center md:justify-between">
          <div className="flex h-8 w-full max-w-[430px] items-center gap-2 rounded border border-[#e6ecf7] bg-[#f7f9fd] px-2">
            <span className="text-xs text-[#8b96ad]">Q</span>
            <input
              type="text"
              placeholder="Search by Ticket ID, User, or Subject..."
              className="w-full border-0 bg-transparent text-xs text-[#2b3a59] outline-none placeholder:text-[#9aa6c0]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="h-8 rounded border border-[#e6ecf7] bg-white px-3 text-[11px] text-[#3a4b70]">
              All Statuses
            </button>
            <button type="button" className="h-8 rounded border border-[#e6ecf7] bg-white px-3 text-[11px] text-[#3a4b70]">
              All Priority
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-[12px]">
            <thead>
              <tr>
                {["TICKET ID", "USER / VENDOR", "TYPE", "SUBJECT", "STATUS", "ACTION"].map((head) => (
                  <th key={head} className="border-b border-[#edf1fa] px-4 py-3 text-left text-[10px] tracking-[0.04em] text-[#7d8ba6]">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {supportApiResponse.tickets.map((ticket, index) => (
                <tr key={ticket.id} className={index % 2 === 1 ? "bg-[#fbfcff]" : ""}>
                  <td className="border-b border-[#edf1fa] px-4 py-3 text-[12px] font-semibold text-[#3b1e8a]">{ticket.id}</td>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Image src={ticket.avatar} alt={ticket.userName} width={24} height={24} className="h-6 w-6 rounded-full" />
                      <div>
                        <div className="text-[12px] font-semibold text-[#1f2d46]">{ticket.userName}</div>
                        <div className="text-[10px] text-[#8b96ad]">{ticket.userRole}</div>
                      </div>
                    </div>
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <span className="rounded bg-[#f1f5f9] px-2 py-1 text-[9px] text-[#64748b]">{ticket.type}</span>
                  </td>
                  <td className="max-w-[300px] overflow-hidden text-ellipsis border-b border-[#edf1fa] px-4 py-3 whitespace-nowrap text-[#1e293b]">
                    {ticket.subject}
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${ticketStatusClass(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <button type="button" onClick={() => setSelectedTicketId(ticket.id)} className="text-[#294f99]" aria-label={`View ${ticket.id}`}>
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
          <span>Showing 1 to {supportApiResponse.tickets.length} of 124 results</span>
          <div className="flex items-center gap-2">
            <button type="button" className="grid h-6 w-6 place-items-center rounded-full border border-[#e6ecf7] text-[#95a2b8]">â€¹</button>
            <button type="button" className="grid h-6 w-6 place-items-center rounded-full bg-[#3b1e8a] text-white">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button" className="grid h-6 w-6 place-items-center rounded-full border border-[#e6ecf7] text-[#95a2b8]">â€º</button>
          </div>
        </footer>
      </section>

      <div
        className={`absolute inset-0 z-20 ${selectedTicket ? "pointer-events-auto" : "pointer-events-none"}`}
        onClick={() => setSelectedTicketId(null)}
        aria-hidden
      />

      <aside
        className={`absolute right-0 top-0 z-30 h-full w-full max-w-[450px] border-l border-[#dbe2ef] bg-[#f6f8fc] transition-transform duration-300 ${
          selectedTicket ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedTicket && (
          <div className="flex h-full flex-col overflow-hidden bg-white">
            <header className="flex items-start justify-between border-b border-[#e6ecf7] px-6 py-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="m-0 text-[33px] leading-none text-[#1d2a43]">{selectedTicket.id}</h3>
                  {selectedTicket.priority === "High" && (
                    <span className="rounded bg-[#fee2e2] px-2 py-0.5 text-[9px] font-semibold text-[#dc2626]">HIGH PRIORITY</span>
                  )}
                </div>
                <p className="m-0 mt-2 text-[13px] text-[#7d8ba6]">Opened {selectedTicket.openedAt}</p>
              </div>
              <button type="button" onClick={() => setSelectedTicketId(null)} className="text-[#95a2b8]">x</button>
            </header>

            <div className="px-6 py-5">
              <section className="mb-6">
                <h4 className="m-0 text-[11px] tracking-[0.09em] text-[#8b96ad] uppercase">Issue Details</h4>
                <p className="m-0 mt-2 rounded-2xl bg-[#f1f5f9] px-4 py-3 text-[13px] leading-[1.45] text-[#475569]">
                  {selectedTicket.issueDetails}
                </p>
              </section>

              <section>
                <h4 className="m-0 text-[11px] tracking-[0.09em] text-[#8b96ad] uppercase">Conversation</h4>
                <div className="mt-3 space-y-3">
                  {selectedTicket.conversation.map((message, i) => (
                    <div key={`${message.time}-${i}`}>
                      <p
                        className={`m-0 max-w-[330px] rounded-2xl p-3 text-[13px] leading-[1.35] ${
                          message.sender === "agent"
                            ? "ml-auto rounded-tr-md bg-[#3b1e8a] text-white"
                            : "rounded-tl-md bg-[#f1f5f9] text-[#475569]"
                        }`}
                      >
                        {message.text}
                      </p>
                      <p className={`m-0 mt-1 text-[9px] text-[#9aa6c0] ${message.sender === "agent" ? "text-right" : ""}`}>
                        {message.name} â€¢ {message.time}
                      </p>
                    </div>
                  ))}
                  <p className="m-0 text-center text-[9px] text-[#9aa6c0] uppercase">Status changed to &quot;In Progress&quot;</p>
                </div>
              </section>
            </div>

            <div className="mt-auto border-t border-[#e6ecf7] bg-[#f8fafc] px-6 py-4">
              <textarea
                placeholder="Type your reply here..."
                className="h-18 w-full rounded-2xl border border-[#dbe2ef] bg-white px-4 py-3 text-[13px] text-[#475569] outline-none"
              />
              <button type="button" className="mt-3 h-11 w-full rounded-full bg-[#3b1e8a] text-[13px] font-semibold text-white">
                Update Ticket &amp; Send Reply
              </button>
            </div>
          </div>
        )}
      </aside>
    </section>
  );
}
