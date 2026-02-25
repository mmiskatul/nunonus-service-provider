"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  FiDownload,
  FiEye,
  FiFilter,
  FiSearch,
  FiSlash,
  FiUser,
  FiUserCheck,
  FiUsers
} from "react-icons/fi";

type UserStatus = "ACTIVE" | "BLOCKED";
type ContactType = "mail" | "phone" | "pin";
type ActionTone = "danger" | "neutral";

type BookingItem = {
  hotel: string;
  range: string;
  amount: string;
  status: string;
  image: string;
};

type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: UserStatus;
  totalBookings: number;
  joinedDate: string;
  memberSince: string;
  age: number;
  stats: {
    bookings: number;
    spent: string;
    rating: string;
  };
  contacts: Array<{
    type: ContactType;
    label: string;
    value: string;
  }>;
  recentBookings: BookingItem[];
  actions: Array<{
    label: string;
    tone: ActionTone;
  }>;
};

const usersApiResponse: {
  summaryCards: Array<{
    label: string;
    value: string;
    trend: string;
    tone: string;
    icon: "users" | "user" | "blocked" | "new";
    iconWrap: string;
  }>;
  users: UserProfile[];
} = {
  summaryCards: [
    {
      label: "TOTAL USERS",
      value: "12,845",
      trend: "+12%",
      tone: "text-[#18b67a] bg-[#dcf7ea]",
      icon: "users",
      iconWrap: "bg-[#e8eefb] text-[#27409b]"
    },
    {
      label: "ACTIVE USERS",
      value: "11,203",
      trend: "+5%",
      tone: "text-[#18b67a] bg-[#dcf7ea]",
      icon: "user",
      iconWrap: "bg-[#dcf7ea] text-[#27409b]"
    },
    {
      label: "BLOCKED USERS",
      value: "452",
      trend: "-2%",
      tone: "text-[#d94848] bg-[#fde7e7]",
      icon: "blocked",
      iconWrap: "bg-[#fde7e7] text-[#e11d48]"
    },
    {
      label: "NEW THIS MONTH",
      value: "1,092",
      trend: "+18%",
      tone: "text-[#f08a1e] bg-[#ffefdc]",
      icon: "new",
      iconWrap: "bg-[#fff4d8] text-[#f59e0b]"
    }
  ],
  users: [
    {
      id: "#USR-82910",
      name: "Sarah Jenkins",
      email: "sarah.j@example.com",
      avatar: "https://i.pravatar.cc/120?img=32",
      status: "ACTIVE",
      totalBookings: 42,
      joinedDate: "Feb 10, 2026",
      memberSince: "Oct 2025",
      age: 29,
      stats: { bookings: 42, spent: "$4.2K", rating: "4.9" },
      contacts: [
        { type: "mail", label: "Email Address", value: "sarah.j@example.com" },
        { type: "phone", label: "Phone Number", value: "+1 (555) 902-3481" },
        { type: "pin", label: "Default Location", value: "San Francisco, CA" }
      ],
      recentBookings: [
        {
          hotel: "Grand Plaza Resort & Spa",
          range: "Feb 10 - Feb 15, 2026",
          amount: "$1,240",
          status: "PAID",
          image: "https://picsum.photos/seed/sarah-1/80/80"
        },
        {
          hotel: "Skyline View Penthouse",
          range: "Jan 22 - Jan 24, 2026",
          amount: "$580",
          status: "PAID",
          image: "https://picsum.photos/seed/sarah-2/80/80"
        }
      ],
      actions: [
        { label: "Block Account", tone: "danger" },
        { label: "Reset Password", tone: "neutral" }
      ]
    },
    {
      id: "#USR-83415",
      name: "Michael Ross",
      email: "m.ross@corp.com",
      avatar: "https://i.pravatar.cc/120?img=59",
      status: "ACTIVE",
      totalBookings: 18,
      joinedDate: "Feb 11, 2026",
      memberSince: "Jan 2025",
      age: 34,
      stats: { bookings: 18, spent: "$1.6K", rating: "4.6" },
      contacts: [
        { type: "mail", label: "Email Address", value: "m.ross@corp.com" },
        { type: "phone", label: "Phone Number", value: "+1 (555) 441-1022" },
        { type: "pin", label: "Default Location", value: "Chicago, IL" }
      ],
      recentBookings: [
        {
          hotel: "Oceanfront Suites",
          range: "Mar 2 - Mar 5, 2026",
          amount: "$740",
          status: "PAID",
          image: "https://picsum.photos/seed/michael-1/80/80"
        },
        {
          hotel: "Lakeview Hotel",
          range: "Jan 11 - Jan 13, 2026",
          amount: "$410",
          status: "PAID",
          image: "https://picsum.photos/seed/michael-2/80/80"
        }
      ],
      actions: [
        { label: "Block Account", tone: "danger" },
        { label: "Reset Password", tone: "neutral" }
      ]
    },
    {
      id: "#USR-82741",
      name: "David Lee",
      email: "david.lee@mail.com",
      avatar: "https://i.pravatar.cc/120?img=68",
      status: "BLOCKED",
      totalBookings: 2,
      joinedDate: "Feb 12, 2026",
      memberSince: "Aug 2024",
      age: 26,
      stats: { bookings: 2, spent: "$220", rating: "3.9" },
      contacts: [
        { type: "mail", label: "Email Address", value: "david.lee@mail.com" },
        { type: "phone", label: "Phone Number", value: "+1 (555) 718-2290" },
        { type: "pin", label: "Default Location", value: "Austin, TX" }
      ],
      recentBookings: [
        {
          hotel: "Metro Stay Inn",
          range: "Feb 1 - Feb 2, 2026",
          amount: "$120",
          status: "PAID",
          image: "https://picsum.photos/seed/david-1/80/80"
        },
        {
          hotel: "Cityline Apartments",
          range: "Nov 6 - Nov 7, 2025",
          amount: "$100",
          status: "PAID",
          image: "https://picsum.photos/seed/david-2/80/80"
        }
      ],
      actions: [
        { label: "Unblock Account", tone: "neutral" },
        { label: "Reset Password", tone: "neutral" }
      ]
    },
    {
      id: "#USR-82109",
      name: "Emma Wilson",
      email: "emma.wilson@live.com",
      avatar: "https://i.pravatar.cc/120?img=44",
      status: "ACTIVE",
      totalBookings: 112,
      joinedDate: "Feb 13, 2026",
      memberSince: "May 2023",
      age: 31,
      stats: { bookings: 112, spent: "$12.8K", rating: "4.9" },
      contacts: [
        { type: "mail", label: "Email Address", value: "emma.wilson@live.com" },
        { type: "phone", label: "Phone Number", value: "+1 (555) 223-8855" },
        { type: "pin", label: "Default Location", value: "Seattle, WA" }
      ],
      recentBookings: [
        {
          hotel: "Mountain Peak Lodge",
          range: "Jan 16 - Jan 21, 2026",
          amount: "$2,140",
          status: "PAID",
          image: "https://picsum.photos/seed/emma-1/80/80"
        },
        {
          hotel: "Downtown Executive Suites",
          range: "Dec 3 - Dec 7, 2025",
          amount: "$1,880",
          status: "PAID",
          image: "https://picsum.photos/seed/emma-2/80/80"
        }
      ],
      actions: [
        { label: "Block Account", tone: "danger" },
        { label: "Reset Password", tone: "neutral" }
      ]
    }
  ]
};

function statusClass(status: UserStatus) {
  if (status === "ACTIVE") {
    return "inline-flex rounded-full bg-[#dcf7ea] px-2 py-1 text-[10px] font-semibold tracking-[0.02em] text-[#137f56]";
  }
  return "inline-flex rounded-full bg-[#fde7e7] px-2 py-1 text-[10px] font-semibold tracking-[0.02em] text-[#c23131]";
}

function summaryIcon(icon: (typeof usersApiResponse.summaryCards)[number]["icon"]) {
  if (icon === "users") return <FiUsers size={20} />;
  if (icon === "user") return <FiUser size={20} />;
  if (icon === "blocked") return <FiSlash size={18} />;
  return <FiUserCheck size={18} />;
}

function SectionIcon({ type }: { type: ContactType }) {
  if (type === "mail") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#8fa0bf]">
        <path d="M3 6h18v12H3V6Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  if (type === "phone") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#8fa0bf]">
        <path
          d="M6.5 3.5 10 3l2 4.5-2.5 1.7a16 16 0 0 0 5.2 5.2l1.8-2.5L21 14l-.5 3.5c-.2 1.1-1.2 1.9-2.4 1.8-7.3-.7-13.3-6.7-14-14-.1-1.2.7-2.2 1.8-2.3Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#8fa0bf]">
      <path
        d="M12 21s6-6.4 6-11a6 6 0 1 0-12 0c0 4.6 6 11 6 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function UsersManagementView() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const selectedUser = useMemo(
    () => usersApiResponse.users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId]
  );

  return (
    <section className="relative space-y-4">
      <div className="space-y-4">
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          {usersApiResponse.summaryCards.map((item) => (
            <article key={item.label} className="rounded-xl border border-[#dbe2ef] bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className={`grid h-10 w-10 place-items-center rounded-lg ${item.iconWrap}`}>
                  {summaryIcon(item.icon)}
                </div>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${item.tone}`}>
                  {item.trend}
                </span>
              </div>
              <p className="m-0 text-[11px] tracking-[0.05em] text-[#70809d]">{item.label}</p>
              <h3 className="m-0 mt-1 text-[39px] leading-none text-[#1d2a43]">{item.value}</h3>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-xl border border-[#dbe2ef] bg-white">
          <div className="flex flex-col gap-2 border-b border-[#e6ecf7] px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div className="flex h-9 w-full max-w-[420px] items-center gap-2 rounded-lg border border-[#edf1fa] bg-[#f7f9fd] px-3">
              <FiSearch size={13} className="text-[#8b96ad]" />
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                className="w-full border-0 bg-transparent text-[12px] text-[#2b3a59] outline-none placeholder:text-[#9aa6c0]"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#dbe2ef] bg-white px-4 text-[13px] text-[#3a4b70]"
              >
                <FiFilter size={12} />
                Filters
              </button>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#dbe2ef] bg-white px-4 text-[13px] text-[#3a4b70]"
              >
                <FiDownload size={12} />
                Export CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-[12px]">
              <thead>
                <tr>
                  {["USER ID", "NAME", "STATUS", "TOTAL BOOKINGS", "JOINED DATE", "ACTIONS"].map((head) => (
                    <th
                      key={head}
                      className="border-b border-[#edf1fa] px-6 py-3 text-left text-[11px] tracking-[0.04em] text-[#6e7f9b]"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usersApiResponse.users.map((user, index) => (
                  <tr key={user.id} className={index % 2 === 1 ? "bg-[#fbfcff]" : ""}>
                    <td className="border-b border-[#edf1fa] px-6 py-4 text-[12px] text-[#9aa6c0]">{user.id}</td>
                    <td className="border-b border-[#edf1fa] px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <Image src={user.avatar} alt={user.name} width={28} height={28} className="h-7 w-7 rounded-full" />
                        <div>
                          <div className="text-[13px] font-semibold text-[#1f2d46]">{user.name}</div>
                          <div className="text-[11px] text-[#7f8ea9]">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-[#edf1fa] px-6 py-4">
                      <span className={statusClass(user.status)}>{user.status}</span>
                    </td>
                    <td className="border-b border-[#edf1fa] px-6 py-4 font-semibold text-[#2f3f60]">{user.totalBookings}</td>
                    <td className="border-b border-[#edf1fa] px-6 py-4 text-[13px] text-[#6e7f9b]">{user.joinedDate}</td>
                    <td className="border-b border-[#edf1fa] px-6 py-4 text-[#60749d]">
                      <div className="flex items-center gap-4 text-sm">
                        <button
                          type="button"
                          onClick={() => setSelectedUserId(user.id)}
                          className="text-[#294f99]"
                          aria-label={`View ${user.name} profile`}
                        >
                          <FiEye size={14} />
                        </button>
                        <button
                          type="button"
                          className={user.status === "BLOCKED" ? "text-[#c2cad8]" : "text-[#ef4444]"}
                          aria-label={`${user.status === "BLOCKED" ? "Restore" : "Block"} ${user.name}`}
                        >
                          <FiSlash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="flex items-center justify-between px-6 py-4 text-[11px] text-[#7f8ea9]">
            <span>Showing 1 to {usersApiResponse.users.length} of 12,845 entries</span>
            <div className="flex items-center gap-3">
              <button type="button" className="text-[#b0bacd]">‹</button>
              <button type="button" className="grid h-7 w-7 place-items-center rounded bg-[#1f3d8f] text-white">
                1
              </button>
              <button type="button">2</button>
              <button type="button">3</button>
              <span>...</span>
              <button type="button">1285</button>
              <button type="button">›</button>
            </div>
          </footer>
        </section>
      </div>

      <div
        className={`absolute inset-0 z-20 ${selectedUser ? "pointer-events-auto" : "pointer-events-none"}`}
        onClick={() => setSelectedUserId(null)}
        aria-hidden
      />

      <aside
        className={`absolute right-0 top-0 z-30 h-full w-full max-w-[286px] border-l border-[#dbe2ef] bg-[#f6f8fc] transition-transform duration-300 ${
          selectedUser ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedUser && (
          <div className="flex h-full flex-col overflow-hidden">
            <div className="border-b border-[#dbe2ef] px-4 py-3">
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="flex items-center gap-2 text-xs text-[#95a2b8]"
              >
                <span className="grid h-4 w-4 place-items-center rounded-full border border-[#d6deed]">x</span>
                <span>User Details</span>
              </button>
            </div>

            <div className="px-5 py-5">
              <div className="mx-auto mb-5 flex w-fit flex-col items-center">
                <div className="relative">
                  <Image
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                    width={86}
                    height={86}
                    className="h-[86px] w-[86px] rounded-full border-[3px] border-[#e8edf7]"
                  />
                  <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#18b67a]" />
                </div>
                <h3 className="m-0 mt-3 text-[33px] font-semibold leading-none text-[#1d2a43]">{selectedUser.name}</h3>
                <p className="m-0 mt-2 text-[14px] text-[#7d8ba6]">
                  {selectedUser.id} &bull; Member since {selectedUser.memberSince}
                </p>
                <p className="m-0 mt-1 text-[12px] text-[#8fa0bf]">Age {selectedUser.age}</p>
              </div>

              <div className="mb-6 grid grid-cols-3 gap-2.5">
                <div className="rounded-lg bg-white px-2 py-3 text-center">
                  <p className="m-0 text-[9px] tracking-[0.12em] text-[#8b96ad]">BOOKINGS</p>
                  <p className="m-0 mt-1 text-[29px] font-semibold leading-none text-[#1f3d8f]">{selectedUser.stats.bookings}</p>
                </div>
                <div className="rounded-lg bg-white px-2 py-3 text-center">
                  <p className="m-0 text-[9px] tracking-[0.12em] text-[#8b96ad]">SPENT</p>
                  <p className="m-0 mt-1 text-[29px] font-semibold leading-none text-[#1f3d8f]">{selectedUser.stats.spent}</p>
                </div>
                <div className="rounded-lg bg-white px-2 py-3 text-center">
                  <p className="m-0 text-[9px] tracking-[0.12em] text-[#8b96ad]">RATING</p>
                  <p className="m-0 mt-1 text-[29px] font-semibold leading-none text-[#1f3d8f]">{selectedUser.stats.rating}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="m-0 mb-3 text-xs tracking-[0.11em] text-[#8b96ad] uppercase">Contact Information</h4>
                <div className="space-y-3">
                  {selectedUser.contacts.map((contact) => (
                    <div key={contact.label} className="flex items-start gap-2">
                      <SectionIcon type={contact.type} />
                      <p className="m-0 text-sm text-[#1f2d46]">
                        <span className="block text-[10px] text-[#8b96ad]">{contact.label}</span>
                        {contact.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="m-0 text-xs tracking-[0.11em] text-[#8b96ad] uppercase">Recent Bookings</h4>
                  <button type="button" className="text-sm text-[#1f3d8f]">
                    View All
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedUser.recentBookings.map((booking) => (
                    <div key={booking.hotel} className="flex items-center gap-2 rounded-lg border border-[#e6ecf7] bg-white p-2">
                      <Image
                        src={booking.image}
                        alt={booking.hotel}
                        width={34}
                        height={34}
                        className="h-[34px] w-[34px] rounded object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="m-0 truncate text-[11px] font-semibold text-[#1f2d46]">{booking.hotel}</p>
                        <p className="m-0 text-[9px] text-[#8b96ad]">{booking.range}</p>
                      </div>
                      <div className="text-right">
                        <p className="m-0 text-[12px] font-semibold text-[#1f2d46]">{booking.amount}</p>
                        <p className="m-0 text-[9px] font-semibold text-[#18b67a]">{booking.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-[#e6ecf7] px-5 py-4">
              {selectedUser.actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className={`flex h-11 w-full items-center justify-between rounded-xl border px-3 text-left text-[15px] ${
                    action.tone === "danger"
                      ? "border-[#f5c8c8] bg-white text-[#eb3b3b]"
                      : "border-[#dbe2ef] bg-white text-[#4e5f83]"
                  }`}
                >
                  <span>{action.label}</span>
                  {action.label.toLowerCase().includes("block") ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M8 16L16 8" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M6 12a6 6 0 1 0 2-4.5" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M4 5v4h4" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>
    </section>
  );
}
