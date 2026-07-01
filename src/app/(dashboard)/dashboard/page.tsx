"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { StatsCard } from "@/components/StatsCard";
import { BookingTrendsChart } from "@/components/BookingTrendsChart";
import { UpcomingBookingsTable } from "@/components/UpcomingBookingsTable";
import { CalendarPreview } from "@/components/CalendarPreview";
import { RecentReviews } from "@/components/RecentReviews";
import { vendorGetDashboardOverview } from "@/lib/vendor-api";

type DashboardOverview = {
  kpis?: {
    total_bookings_month?: number;
    todays_bookings?: number;
    monthly_revenue?: number;
    occupancy_rate?: number;
    average_rating?: number;
  };
};

function formatCurrency(value: unknown) {
  const amount = Number(value ?? 0);
  return `$${amount.toLocaleString()}`;
}

export default function Dashboard() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorGetDashboardOverview()
      .then((payload) => setOverview(payload as DashboardOverview))
      .catch(() => setOverview(null))
      .finally(() => setLoading(false));
  }, []);

  const kpis = overview?.kpis;

  return (
    <div className="min-h-screen">
      <Header />

      <div className="p-10 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <StatsCard
            title="Total Bookings (MO)"
            value={loading ? "..." : String(kpis?.total_bookings_month ?? 0)}
            trend={{ value: "Current month", type: "neutral" }}
          />
          <StatsCard
            title="Today's Bookings"
            value={loading ? "..." : String(kpis?.todays_bookings ?? 0)}
            trend={{ value: "Scheduled today", type: "alert" }}
          />
          <StatsCard
            title="Monthly Revenue"
            value={loading ? "..." : formatCurrency(kpis?.monthly_revenue)}
            trend={{ value: "Month to date", type: "up" }}
          />
          <StatsCard
            title="Occupancy Rate"
            value={loading ? "..." : `${Number(kpis?.occupancy_rate ?? 0)}%`}
            trend={{ value: "Live utilization", type: "success" }}
          />
          <StatsCard
            title="Average Rating"
            value={loading ? "..." : Number(kpis?.average_rating ?? 0).toFixed(1)}
            trend={{ value: "Live reviews", type: "rating" }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <BookingTrendsChart />
          </div>
          <div>
            <CalendarPreview />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <UpcomingBookingsTable />
          </div>
          <div>
            <RecentReviews />
          </div>
        </div>
      </div>
    </div>
  );
}
