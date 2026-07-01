"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  ChevronDown,
  Download,
  TrendingDown,
  TrendingUp,
  Users,
  DollarSign,
  Bed,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/DatePicker";
import { Header } from "@/components/Header";
import { vendorExportAnalytics, vendorGetAnalyticsOverview } from "@/lib/vendor-api";

type AnalyticsOverview = {
  total_bookings?: number;
  todays_bookings?: number;
  monthly_revenue?: number;
  occupancy_rate?: number;
  average_rating?: number;
  demographics?: {
    gender_distribution?: { female?: number; male?: number };
    age_groups?: Record<string, number>;
  };
  occupancy_tracking?: {
    occupancy_rate?: number;
    rooms_available?: number;
    rooms_total?: number;
    active_bookings?: number;
  };
  reviews_summary?: {
    average_rating?: number;
    total_reviews?: number;
    breakdown?: Record<string, number>;
  };
};

type StatItem = {
  label: string;
  value: string;
  trend: string;
  trendType: "up" | "down";
  icon: typeof Calendar;
  color: string;
  bg: string;
};

const STAT_BASE: StatItem[] = [
  {
    label: "TOTAL BOOKINGS",
    value: "0",
    trend: "+0%",
    trendType: "up",
    icon: Calendar,
    color: "text-sky-500",
    bg: "bg-sky-50",
  },
  {
    label: "TOTAL REVENUE",
    value: "$0",
    trend: "+0%",
    trendType: "up",
    icon: DollarSign,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    label: "OCCUPANCY RATE",
    value: "0%",
    trend: "0%",
    trendType: "down",
    icon: Bed,
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
  {
    label: "AVERAGE RATING",
    value: "0.0 / 5.0",
    trend: "0",
    trendType: "up",
    icon: Star,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
];

function percentLabel(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0%";
  return `${value}%`;
}

export default function AnalyticsPage() {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });

  useEffect(() => {
    vendorGetAnalyticsOverview()
      .then((data) => setOverview(data as AnalyticsOverview))
      .catch(() => setOverview(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }

    if (isCalendarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCalendarOpen]);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await vendorExportAnalytics();
    } catch (error) {
      console.warn("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  const stats: StatItem[] = [
    {
      ...STAT_BASE[0],
      value: String(overview?.total_bookings ?? 0),
      trend: "+0%",
      trendType: "up",
    },
    {
      ...STAT_BASE[1],
      value: overview?.monthly_revenue != null ? `$${Number(overview.monthly_revenue).toLocaleString()}` : "$0",
      trend: "+0%",
      trendType: "up",
    },
    {
      ...STAT_BASE[2],
      value: percentLabel(overview?.occupancy_rate ?? overview?.occupancy_tracking?.occupancy_rate),
      trend: "0%",
      trendType: "down",
    },
    {
      ...STAT_BASE[3],
      value: `${Number(overview?.average_rating ?? overview?.reviews_summary?.average_rating ?? 0).toFixed(1)} / 5.0`,
      trend: `${Number(overview?.reviews_summary?.total_reviews ?? 0)}`,
      trendType: "up",
    },
  ];

  const demographics = overview?.demographics ?? {};
  const gender = demographics.gender_distribution ?? {};
  const ageGroups = demographics.age_groups ?? {};
  const occupancy = overview?.occupancy_tracking ?? {};
  const reviews = overview?.reviews_summary ?? {};
  const breakdown = reviews.breakdown ?? {};
  const rangeText =
    dateRange.start && dateRange.end
      ? `${format(dateRange.start, "MMM dd")} - ${format(dateRange.end, "MMM dd, yyyy")}`
      : dateRange.start
        ? `${format(dateRange.start, "MMM dd")} - Select End`
        : "Select Date Range";

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col pb-10">
      <Header title="Analytics" />

      <main className="flex-1 p-6 md:p-10 space-y-8">
        <div className="mx-auto max-w-[1400px] space-y-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Business Analytics</h1>
              <p className="mt-1 text-sm text-slate-400">Live metrics from the vendor analytics endpoints.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative" ref={calendarRef}>
                <div
                  onClick={() => setIsCalendarOpen((value) => !value)}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-2.5 shadow-sm transition-colors hover:bg-slate-50"
                >
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-600">{rangeText}</span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </div>
                {isCalendarOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2">
                    <DatePicker onClose={() => setIsCalendarOpen(false)} selectedRange={dateRange} onRangeChange={setDateRange} />
                  </div>
                )}
              </div>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 rounded-xl bg-[#1e2a5e] px-6 py-2.5 text-sm font-bold text-white shadow-xl shadow-slate-900/10 transition-all hover:bg-[#1a2552] disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Exporting..." : "Export Report"}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="rounded-[32px] border border-slate-100 bg-white p-10 text-sm text-slate-400">Loading analytics...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
                    <div className="mb-6 flex items-center justify-between">
                      <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                        <stat.icon className="h-6 w-6" />
                      </div>
                      <div className={cn("flex items-center gap-1 text-xs font-black", stat.trendType === "down" ? "text-rose-500" : "text-emerald-500")}>
                        {stat.trendType === "down" ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                        {stat.trend}
                      </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                    <h3 className="mt-1 text-2xl font-bold text-slate-800">{stat.value}</h3>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
                <div className="xl:col-span-2 rounded-[40px] border border-slate-100 bg-white p-10 shadow-sm">
                  <h3 className="mb-10 text-xl font-bold text-slate-800">Customer Demographics</h3>
                  <div className="flex flex-col gap-12 md:flex-row md:items-center">
                    <div className="relative h-64 w-64 shrink-0">
                      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#eff6ff" strokeWidth="12" />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#38bdf8"
                          strokeWidth="12"
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 * (1 - ((gender.female ?? 0) / 100))}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-sm font-black uppercase tracking-widest text-slate-400">Gender</span>
                        <span className="text-[10px] font-medium text-slate-400">Distribution</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-6">
                      <div className="mb-10 flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-sky-500" />
                          <span className="text-xs font-bold text-slate-600">Female ({gender.female ?? 0}%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-sky-100" />
                          <span className="text-xs font-bold text-slate-400">Male ({gender.male ?? 0}%)</span>
                        </div>
                      </div>

                      {Object.entries(ageGroups).map(([label, value]) => (
                        <div key={label} className="space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-black tracking-wider">
                            <span className="text-slate-400">{label.toUpperCase()} YEARS</span>
                            <span className="text-slate-600">{value as number}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-50">
                            <div className="h-full rounded-full bg-sky-500" style={{ width: `${value as number}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex h-full flex-col rounded-[40px] border border-slate-100 bg-white p-10 shadow-sm">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Occupancy Tracking</h3>
                    <p className="mt-1 text-sm text-slate-400">Real-time utilization</p>
                  </div>

                  <div className="flex flex-1 flex-col items-center justify-center py-10">
                    <div className="relative h-48 w-48">
                      <svg viewBox="0 0 100 50" className="h-full w-full">
                        <path
                          d="M 10 50 A 40 40 0 1 1 90 50"
                          fill="transparent"
                          stroke="#f1f5f9"
                          strokeWidth="10"
                          strokeLinecap="round"
                        />
                        <path
                          d="M 10 50 A 40 40 0 1 1 90 50"
                          fill="transparent"
                          stroke="#1e293b"
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray="125.6"
                          strokeDashoffset={125.6 * (1 - ((occupancy.occupancy_rate ?? 0) / 100))}
                        />
                      </svg>
                      <div className="absolute inset-x-0 bottom-4 flex flex-col items-center">
                        <span className="text-4xl font-black text-slate-800">{occupancy.occupancy_rate ?? 0}%</span>
                        <span className="mt-1 text-[10px] font-black uppercase tracking-widest text-sky-500">In Use</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-slate-50 pt-6">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Rooms Available</span>
                      <span className="text-xs font-bold tracking-tight text-slate-800">
                        {occupancy.rooms_available ?? 0} / {occupancy.rooms_total ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Active Bookings</span>
                      <span className="text-xs font-bold tracking-tight text-slate-800">{occupancy.active_bookings ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Total Reviews</span>
                      <span className="text-xs font-bold uppercase tracking-widest text-[10px] text-slate-800">
                        {reviews.total_reviews ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[40px] border border-slate-100 bg-white p-10 shadow-sm">
                <div className="mb-10 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-800">Reviews & Ratings Summary</h3>
                  <button className="text-sm font-bold text-sky-600 transition-colors hover:text-sky-700">View All Feedback</button>
                </div>

                <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                  <div className="lg:col-span-3 flex flex-col items-center md:items-start">
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-black text-slate-800">
                        {Number(reviews.average_rating ?? 0).toFixed(1)}
                      </span>
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="h-4 w-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {reviews.total_reviews ?? 0} reviews
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-9 space-y-4">
                    {["5", "4", "3", "2", "1"].map((star) => {
                      const count = Number(breakdown[star] ?? 0);
                      const total = Number(reviews.total_reviews ?? 0) || 1;
                      const percentage = Math.round((count / total) * 100);
                      return (
                        <div key={star} className="space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                            <span className="text-slate-400">{star} star</span>
                            <span className="text-slate-600">{count}</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-50">
                            <div className="h-full rounded-full bg-amber-400" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
