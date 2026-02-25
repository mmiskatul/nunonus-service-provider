const avatarSarah =
  "https://www.figma.com/api/mcp/asset/158be619-38ef-4718-a67e-c6f4f290f2ff";
const avatarTechflow =
  "https://www.figma.com/api/mcp/asset/1f7dd8ac-940f-4872-8cd6-ce59a7e2c653";
const avatarJohn =
  "https://www.figma.com/api/mcp/asset/ea966fea-399f-4c9f-bdc1-c68b71f2964d";

type TicketStatus = "In Progress" | "Open" | "Resolved";
type TicketType = "Account" | "Technical";

type Ticket = {
  id: string;
  name: string;
  role: "User" | "Vendor";
  avatar: string;
  type: TicketType;
  subject: string;
  status: TicketStatus;
};

const tickets: Ticket[] = [
  {
    id: "#TK-8802",
    name: "Sarah Jenkins",
    role: "User",
    avatar: avatarSarah,
    type: "Account",
    subject: "Unable to process monthly subscription payment",
    status: "In Progress"
  },
  {
    id: "#TK-8795",
    name: "TechFlow Solutions",
    role: "Vendor",
    avatar: avatarTechflow,
    type: "Technical",
    subject: "API Endpoint returning 500 error on callback",
    status: "Open"
  },
  {
    id: "#TK-8742",
    name: "John Doe",
    role: "User",
    avatar: avatarJohn,
    type: "Account",
    subject: "Request to change registered email address",
    status: "Resolved"
  }
];

const metrics = [
  { label: "Total Tickets", value: "124", tone: "all" },
  { label: "Open Tickets", value: "45", tone: "open" },
  { label: "In Progress", value: "67", tone: "progress" },
  { label: "High Priority", value: "12", tone: "high" }
] as const;

function statusClass(status: TicketStatus) {
  if (status === "Open") return "inline-block rounded-full bg-[#dbeafe] px-[10px] py-1 text-xs font-bold text-[#1d4ed8]";
  if (status === "Resolved") return "inline-block rounded-full bg-[#dcfce7] px-[10px] py-1 text-xs font-bold text-[#15803d]";
  return "inline-block rounded-full bg-[#fef3c7] px-[10px] py-1 text-xs font-bold text-[#b45309]";
}

function metricClass(tone: (typeof metrics)[number]["tone"]) {
  if (tone === "open") {
    return "grid h-12 w-12 place-items-center rounded-[14px] bg-[#dbeafe] font-bold text-[#1d4ed8]";
  }
  if (tone === "progress") {
    return "grid h-12 w-12 place-items-center rounded-[14px] bg-[#fef3c7] font-bold text-[#b45309]";
  }
  if (tone === "high") {
    return "grid h-12 w-12 place-items-center rounded-[14px] bg-[#fee2e2] font-bold text-[#b91c1c]";
  }
  return "grid h-12 w-12 place-items-center rounded-[14px] bg-[#ede9fe] font-bold text-[#3b1e8a]";
}

export function SupportDashboardView() {
  return (
    <section className="grid gap-3.5">
      <header>
        <h2 className="m-0 text-[28px] leading-[1.15]">Support Tickets</h2>
        <p className="m-0 mt-1.5 text-sm text-[#6c7890]">
          Manage support issues and respond quickly from one workspace.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="flex items-center gap-3 rounded-2xl border border-[#dbe2ef] bg-white p-3.5"
          >
            <div className={metricClass(metric.tone)} aria-hidden>
              {metric.tone === "all" && "T"}
              {metric.tone === "open" && "O"}
              {metric.tone === "progress" && "P"}
              {metric.tone === "high" && "!"}
            </div>
            <div>
              <p className="m-0 text-[13px] text-[#64748b]">{metric.label}</p>
              <strong className="text-[32px] leading-none text-[#0f172a]">{metric.value}</strong>
            </div>
          </article>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_450px]">
        <article className="overflow-hidden rounded-[24px] border border-[#e2e8f0] bg-white">
          <div className="flex flex-col items-stretch gap-4 border-b border-[#e2e8f0] p-4 md:flex-row md:items-center">
            <div className="flex h-[46px] min-w-[180px] flex-1 items-center gap-2 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-3.5">
              <span className="text-[#94a3b8]" aria-hidden>
                Q
              </span>
              <input
                type="text"
                defaultValue=""
                placeholder="Search by Ticket ID, User, or Subject..."
                className="w-full border-0 bg-transparent text-base text-[#334155] outline-none placeholder:text-[#6b7280]"
              />
            </div>
            <div className="flex w-full gap-2 md:w-auto">
              <button
                type="button"
                className="h-[42px] flex-1 cursor-pointer rounded-2xl border border-[#e2e8f0] bg-white px-3.5 text-xs font-semibold text-[#1e293b] md:flex-none"
              >
                All Statuses
              </button>
              <button
                type="button"
                className="h-[42px] flex-1 cursor-pointer rounded-2xl border border-[#e2e8f0] bg-white px-3.5 text-xs font-semibold text-[#1e293b] md:flex-none"
              >
                All Priority
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-[#f1f5f9] bg-[#f8fafc] px-6 py-4 text-left text-xs tracking-[0.05em] text-[#64748b] uppercase">
                    Ticket ID
                  </th>
                  <th className="border-b border-[#f1f5f9] bg-[#f8fafc] px-6 py-4 text-left text-xs tracking-[0.05em] text-[#64748b] uppercase">
                    User / Vendor
                  </th>
                  <th className="border-b border-[#f1f5f9] bg-[#f8fafc] px-6 py-4 text-left text-xs tracking-[0.05em] text-[#64748b] uppercase">
                    Type
                  </th>
                  <th className="border-b border-[#f1f5f9] bg-[#f8fafc] px-6 py-4 text-left text-xs tracking-[0.05em] text-[#64748b] uppercase">
                    Subject
                  </th>
                  <th className="border-b border-[#f1f5f9] bg-[#f8fafc] px-6 py-4 text-left text-xs tracking-[0.05em] text-[#64748b] uppercase">
                    Status
                  </th>
                  <th className="border-b border-[#f1f5f9] bg-[#f8fafc] px-6 py-4 text-left text-xs tracking-[0.05em] text-[#64748b] uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="border-b border-[#f1f5f9] px-6 py-4 text-left font-bold text-[#3b1e8a]">
                      {ticket.id}
                    </td>
                    <td className="border-b border-[#f1f5f9] px-6 py-4 text-left">
                      <div className="flex items-center gap-3">
                        <img
                          src={ticket.avatar}
                          alt=""
                          className="h-8 w-8 rounded-full border border-[#e2e8f0]"
                        />
                        <div>
                          <strong className="block text-sm">{ticket.name}</strong>
                          <span className="block text-xs text-[#64748b]">{ticket.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-[#f1f5f9] px-6 py-4 text-left">
                      <span className="inline-block rounded-lg bg-[#f1f5f9] px-2 py-1 text-[11px] font-bold text-[#475569]">
                        {ticket.type}
                      </span>
                    </td>
                    <td className="max-w-[320px] overflow-hidden text-ellipsis border-b border-[#f1f5f9] px-6 py-4 text-left text-[#1e293b] whitespace-nowrap">
                      {ticket.subject}
                    </td>
                    <td className="border-b border-[#f1f5f9] px-6 py-4 text-left">
                      <span className={statusClass(ticket.status)}>{ticket.status}</span>
                    </td>
                    <td className="border-b border-[#f1f5f9] px-6 py-4 text-left">
                      <button
                        type="button"
                        className="cursor-pointer rounded-xl border border-[#e2e8f0] bg-white px-3 py-[7px] text-xs text-[#64748b]"
                        aria-label="View ticket"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="flex flex-col items-start justify-between gap-3 bg-[#f8fafc] p-4 text-xs text-[#64748b] md:flex-row md:items-center">
            <span>Showing 1 to 10 of 124 results</span>
            <nav className="flex gap-1" aria-label="Ticket pages">
              <button
                type="button"
                className="h-8 w-8 cursor-pointer rounded-lg border border-[#e2e8f0] bg-white font-bold text-[#475569]"
                aria-label="Previous page"
              >
                {"<"}
              </button>
              <button
                type="button"
                className="h-8 w-8 cursor-pointer rounded-lg border border-[#3b1e8a] bg-[#3b1e8a] font-bold text-white"
              >
                1
              </button>
              <button
                type="button"
                className="h-8 w-8 cursor-pointer rounded-lg border border-[#e2e8f0] bg-white font-bold text-[#475569]"
              >
                2
              </button>
              <button
                type="button"
                className="h-8 w-8 cursor-pointer rounded-lg border border-[#e2e8f0] bg-white font-bold text-[#475569]"
              >
                3
              </button>
              <button
                type="button"
                className="h-8 w-8 cursor-pointer rounded-lg border border-[#e2e8f0] bg-white font-bold text-[#475569]"
                aria-label="Next page"
              >
                {">"}
              </button>
            </nav>
          </footer>
        </article>

        <aside className="grid min-h-[860px] grid-rows-[auto_1fr_auto] rounded-[24px] border border-[#e2e8f0] bg-white xl:min-h-0">
          <header className="flex items-start justify-between gap-2 border-b border-[#f1f5f9] p-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="m-0 text-[28px]">#TK-8802</h3>
                <span className="rounded-lg bg-[#fee2e2] px-2 py-0.5 text-[11px] font-extrabold text-[#b91c1c] uppercase">
                  High Priority
                </span>
              </div>
              <p className="m-0 mt-1 text-[#64748b]">Opened Oct 24, 2023 • 09:45 AM</p>
            </div>
            <button
              type="button"
              className="h-8 w-8 cursor-pointer rounded-lg border border-[#e2e8f0] bg-white font-bold text-[#475569]"
              aria-label="Close panel"
            >
              X
            </button>
          </header>

          <div className="overflow-auto p-6">
            <section>
              <h4 className="mb-3 text-sm tracking-[0.1em] text-[#94a3b8] uppercase">Issue Details</h4>
              <div className="mb-6 rounded-[24px] border border-[#f1f5f9] bg-[#f8fafc] p-4 text-[#334155]">
                <p className="m-0 leading-relaxed">
                  Hello, I&apos;ve been trying to renew my premium subscription for the last
                  2 hours. Every time I enter my card details, the page spins and eventually
                  shows a generic error. Please help.
                </p>
              </div>
            </section>

            <section>
              <h4 className="mb-3 text-sm tracking-[0.1em] text-[#94a3b8] uppercase">Conversation</h4>
              <div className="mb-3">
                <p className="ml-auto max-w-[360px] rounded-[24px] rounded-tr-md bg-[#3b1e8a] p-4 text-white">
                  Hello Sarah, thank you for reaching out. We are looking into our payment
                  gateway logs right now. Could you confirm if you are using a VPN?
                </p>
                <span className="mt-2 block text-right text-[10px] font-bold text-[#94a3b8]">
                  You • 10:15 AM
                </span>
              </div>
              <div className="mb-3">
                <p className="max-w-[360px] rounded-[24px] rounded-tl-md bg-[#f1f5f9] p-4 text-[#334155]">
                  Yes, I am using a corporate VPN. Does that matter?
                </p>
                <span className="mt-2 block text-[10px] font-bold text-[#94a3b8]">
                  Sarah Jenkins • 10:22 AM
                </span>
              </div>
              <p className="m-0 mt-4 text-center text-[10px] font-bold tracking-[0.03em] text-[#94a3b8] uppercase">
                Status changed to &quot;In Progress&quot;
              </p>
            </section>
          </div>

          <footer className="border-t border-[#e2e8f0] bg-[#f8fafc] p-6">
            <textarea
              placeholder="Type your reply here..."
              className="min-h-24 w-full resize-y rounded-[24px] border border-[#e2e8f0] p-4 text-sm outline-none"
            />
            <button
              type="button"
              className="mt-4 h-11 w-full cursor-pointer rounded-[24px] border-0 bg-[#3b1e8a] text-sm font-bold text-white"
            >
              Update Ticket &amp; Send Reply
            </button>
          </footer>
        </aside>
      </div>
    </section>
  );
}
