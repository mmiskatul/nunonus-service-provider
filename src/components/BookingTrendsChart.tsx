"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { vendorGetBookingTrends } from "@/lib/vendor-api";

interface TrendPoint {
  name?: string;
  period?: string;
  value?: number;
  count?: number;
}

export function BookingTrendsChart() {
  const [data, setData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorGetBookingTrends()
      .then((result) => {
        const raw = result as { items?: TrendPoint[]; data?: TrendPoint[]; trends?: TrendPoint[] };
        const items: TrendPoint[] = raw?.items ?? raw?.data ?? raw?.trends ?? [];
        setData(
          items.map((p) => ({
            name: p.name ?? p.period ?? "",
            value: p.value ?? p.count ?? 0,
          })),
        );
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  const maxValue = Math.max(...data.map((d) => d.value ?? 0), 1);

  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-100 flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-bold text-slate-800">Booking Trends</h3>
        {loading && (
          <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        {data.length === 0 ? (
          <div className="flex h-full min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
            No trend data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                domain={[0, Math.ceil(maxValue * 1.2)]}
              />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Bar dataKey="value" fill="#1e2a5e" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
