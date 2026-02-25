"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  FiCalendar,
  FiShoppingBag,
  FiSmile,
  FiTag,
  FiUsers
} from "react-icons/fi";
import { FaStar } from "react-icons/fa6";

type Range = "weekly" | "monthly";

const stats = [
  {
    label: "TOTAL REVENUE",
    value: "$4,285,120",
    sub: "vs. $3.8M last month",
    trend: "+12.5%",
    icon: FiTag
  },
  {
    label: "ACTIVE USERS",
    value: "85,420",
    sub: "Daily active sessions peak",
    trend: "+5.2%",
    icon: FiUsers
  },
  {
    label: "ACTIVE VENDORS",
    value: "85,40",
    sub: "Daily active sessions peak",
    trend: "+5.2%",
    icon: FiShoppingBag
  },
  {
    label: "TOTAL BOOKINGS",
    value: "12,300",
    sub: "Across all 52 vendors",
    trend: "+8.1%",
    icon: FiCalendar
  },
  {
    label: "Customer Satisfaction",
    value: "4.82/5",
    sub: "BASED ON 12K REVIEWS",
    trend: "0.0%",
    icon: FiSmile
  }
] as const;

const monthlyData = [
  { period: "JAN", value: 38 },
  { period: "FEB", value: 55 },
  { period: "MAR", value: 42 },
  { period: "APR", value: 68 },
  { period: "MAY", value: 60 },
  { period: "JUN", value: 84 },
  { period: "JUL", value: 95 },
  { period: "AUG", value: 78 },
  { period: "SEP", value: 90 },
  { period: "OCT", value: 74 },
  { period: "NOV", value: 82 },
  { period: "DEC", value: 98 }
];

const weeklyData = [
  { period: "MON", value: 52 },
  { period: "TUE", value: 71 },
  { period: "WED", value: 64 },
  { period: "THU", value: 86 },
  { period: "FRI", value: 93 },
  { period: "SAT", value: 88 },
  { period: "SUN", value: 97 }
];

const bookingByRange = {
  monthly: [
    { name: "Hotels & Stays", value: 45, color: "#27409b" },
    { name: "Flight Bundles", value: 32, color: "#7a88ff" },
    { name: "Local Tours", value: 23, color: "#dce2ef" }
  ],
  weekly: [
    { name: "Hotels & Stays", value: 43, color: "#27409b" },
    { name: "Flight Bundles", value: 34, color: "#7a88ff" },
    { name: "Local Tours", value: 23, color: "#dce2ef" }
  ]
} as const;

const vendors = [
  { code: "AL", name: "Azure Luxury Resorts", category: "Hospitality", rating: "4.9", revenue: "$1,240,500", status: "TOP PERFORMER" },
  { code: "SA", name: "SkyHigh Airways", category: "Aviation", rating: "4.7", revenue: "$890,200", status: "STEADY" },
  { code: "GT", name: "Global Travels Co.", category: "Tours", rating: "4.2", revenue: "$450,100", status: "AT RISK" },
  { code: "UV", name: "Urban Velocity", category: "Car Rentals", rating: "4.5", revenue: "$312,000", status: "STEADY" }
];

function vendorStatusClass(status: string) {
  if (status === "TOP PERFORMER") return "bg-[#dcf7ea] text-[#137f56]";
  if (status === "AT RISK") return "bg-[#ffeecf] text-[#ae6a09]";
  return "bg-[#e0ebff] text-[#2456a9]";
}

export function DashboardView() {
  const [range, setRange] = useState<Range>("monthly");

  const revenueData = range === "weekly" ? weeklyData : monthlyData;
  const pieData = bookingByRange[range];

  return (
    <section className="space-y-4">
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        {stats.map((card) => (
          <article key={card.label} className="rounded-xl border border-[#dbe2ef] bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-[#eef2fb] text-[#27409b]">
                <card.icon size={23} strokeWidth={2.2} />
              </div>
              <span className="text-[11px] font-semibold text-[#17a765]">~{card.trend}</span>
            </div>
            <p className="m-0 mt-4 text-[12px] tracking-[0.04em] text-[#7a88a6]">{card.label}</p>
            <h3 className="m-0 mt-1 text-[42px] leading-none text-[#1f2b43]">{card.value}</h3>
            <p className="m-0 mt-2 text-[10px] text-[#97a3bc]">{card.sub}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[2.2fr_1fr]">
        <article className="rounded-xl border border-[#dbe2ef] bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="m-0 text-[32px] font-semibold text-[#1f2b43]">Revenue Growth Over Time</h3>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setRange("weekly")}
                className={`rounded border px-3 py-1 text-[11px] ${range === "weekly" ? "border-[#8ca0d8] bg-[#eef2fb] text-[#27409b]" : "border-[#dbe2ef] bg-[#f5f7fc] text-[#667792]"}`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setRange("monthly")}
                className={`rounded border px-3 py-1 text-[11px] ${range === "monthly" ? "border-[#8ca0d8] bg-[#eef2fb] text-[#27409b]" : "border-[#dbe2ef] bg-[#f5f7fc] text-[#667792]"}`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="h-[330px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
              <BarChart data={revenueData} margin={{ top: 12, right: 4, left: 0, bottom: 8 }} barGap={4}>
                <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#9aa6c0", fontWeight: 700 }} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip formatter={(v: number) => [`${v}`, "Index"]} />
                <Bar dataKey="value" fill="#bec5d8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-xl border border-[#dbe2ef] bg-white p-4">
          <h3 className="m-0 mb-2 text-[32px] font-semibold text-[#1f2b43]">Booking Insights</h3>
          <div className="relative h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={86} paddingAngle={0}>
                  {pieData.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="m-0 text-[44px] font-semibold text-[#1f2b43]">12.3k</p>
                <p className="m-0 text-[11px] text-[#9aa6c0]">TOTAL</p>
              </div>
            </div>
          </div>
          <ul className="m-0 mt-2 list-none space-y-2 p-0 text-[14px]">
            {pieData.map((item) => (
              <li key={item.name} className="flex items-center justify-between text-[#5f6f8b]">
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                  {item.name}
                </span>
                <strong className="text-[#2b3852]">{item.value}%</strong>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-xl border border-[#dbe2ef] bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="m-0 text-[34px] font-semibold text-[#1f2b43]">Vendor Performance Snapshot</h3>
          <a href="#" className="text-[13px] font-semibold text-[#2648a0]">View All Vendors</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-[14px]">
            <thead>
              <tr>
                <th className="border-b border-[#edf1fa] px-4 py-3 text-left text-[10px] tracking-[0.04em] text-[#8b96ad]">VENDOR NAME</th>
                <th className="border-b border-[#edf1fa] px-4 py-3 text-left text-[10px] tracking-[0.04em] text-[#8b96ad]">CATEGORY</th>
                <th className="border-b border-[#edf1fa] px-4 py-3 text-left text-[10px] tracking-[0.04em] text-[#8b96ad]">RATINGS</th>
                <th className="border-b border-[#edf1fa] px-4 py-3 text-left text-[10px] tracking-[0.04em] text-[#8b96ad]">REVENUE</th>
                <th className="border-b border-[#edf1fa] px-4 py-3 text-left text-[10px] tracking-[0.04em] text-[#8b96ad]">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor, i) => (
                <tr key={vendor.name} className={i % 2 === 1 ? "bg-[#fbfcff]" : ""}>
                  <td className="border-b border-[#edf1fa] px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-7 w-7 place-items-center rounded bg-[#edf2fb] text-[11px] font-semibold text-[#415a91]">{vendor.code}</span>
                      <strong className="text-[#1f2b43]">{vendor.name}</strong>
                    </div>
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-4 text-[#6f7e98]">{vendor.category}</td>
                  <td className="border-b border-[#edf1fa] px-4 py-4">
                    <span className="flex items-center gap-1 text-[#2b3852]"><FaStar size={11} className="text-[#f6b329]" /> {vendor.rating}</span>
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-4 font-semibold text-[#2b3852]">{vendor.revenue}</td>
                  <td className="border-b border-[#edf1fa] px-4 py-4">
                    <span className={`rounded px-2 py-1 text-[10px] font-semibold ${vendorStatusClass(vendor.status)}`}>{vendor.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
