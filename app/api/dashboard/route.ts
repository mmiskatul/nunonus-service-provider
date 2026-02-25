import { readJson, jsonError, jsonOk } from "@/app/api/_data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Range = "weekly" | "monthly";
type StatIcon = "tag" | "users" | "shopping_bag" | "calendar" | "smile";

type ChartPoint = { period: string; value: number };
type VendorRow = { code: string; name: string; category: string; rating: string; revenue: string; status: string };
type BookingPercentSlice = { name: string; value: number; color: string };
type BookingCountSlice = { name: string; count: number; color: string };
type LegacyStatCard = { label: string; value: string; sub: string; trend: string; icon: StatIcon };
type ComputedStatMetric = {
  label: string;
  current: number;
  previous: number;
  sub?: string;
  icon: StatIcon;
  format?: "currency" | "count" | "score";
  decimals?: number;
  scoreMax?: number;
};
type DashboardPayload = {
  stats: LegacyStatCard[];
  monthlyData: ChartPoint[];
  weeklyData: ChartPoint[];
  bookingByRange: Record<Range, BookingPercentSlice[]>;
  bookingTotals: Record<Range, number>;
  vendors: VendorRow[];
};
type DashboardDataFile = {
  stats?: LegacyStatCard[];
  statMetrics?: ComputedStatMetric[];
  monthlyData?: ChartPoint[];
  weeklyData?: ChartPoint[];
  bookingByRange?: Record<Range, BookingPercentSlice[]>;
  bookingMetricsByRange?: Record<Range, BookingCountSlice[]>;
  bookingTotals?: Record<Range, number>;
  vendors?: VendorRow[];
};

function formatValue(metric: ComputedStatMetric) {
  if (metric.format === "currency") {
    return `$${Math.round(metric.current).toLocaleString()}`;
  }
  if (metric.format === "score") {
    const decimals = metric.decimals ?? 2;
    const max = metric.scoreMax ?? 5;
    return `${metric.current.toFixed(decimals)}/${max}`;
  }
  return Math.round(metric.current).toLocaleString();
}

function calculateTrend(current: number, previous: number) {
  if (previous <= 0) {
    return "0.0%";
  }
  const delta = ((current - previous) / previous) * 100;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}%`;
}

function calculatePercentSeries(items: BookingCountSlice[]) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  if (total <= 0) {
    return {
      total: 0,
      series: items.map((item) => ({ name: item.name, color: item.color, value: 0 }))
    };
  }

  const roundedSeries = items.map((item) => ({
    name: item.name,
    color: item.color,
    value: Number(((item.count / total) * 100).toFixed(1))
  }));

  const running = roundedSeries.reduce((sum, item) => sum + item.value, 0);
  const correction = Number((100 - running).toFixed(1));
  if (roundedSeries.length > 0 && correction !== 0) {
    const last = roundedSeries.length - 1;
    roundedSeries[last] = {
      ...roundedSeries[last],
      value: Number((roundedSeries[last].value + correction).toFixed(1))
    };
  }

  return { total, series: roundedSeries };
}

export async function GET() {
  try {
    const data = (await readJson("dashboard.json")) as DashboardDataFile;

    const stats =
      data.statMetrics && data.statMetrics.length > 0
        ? data.statMetrics.map((metric) => ({
            label: metric.label,
            value: formatValue(metric),
            sub: metric.sub ?? "",
            trend: calculateTrend(metric.current, metric.previous),
            icon: metric.icon
          }))
        : (data.stats ?? []);

    const monthlyCountMetrics = data.bookingMetricsByRange?.monthly ?? [];
    const weeklyCountMetrics = data.bookingMetricsByRange?.weekly ?? [];
    const monthlyComputed = calculatePercentSeries(monthlyCountMetrics);
    const weeklyComputed = calculatePercentSeries(weeklyCountMetrics);

    const bookingByRange = data.bookingMetricsByRange
      ? {
          monthly: monthlyComputed.series,
          weekly: weeklyComputed.series
        }
      : {
          monthly: data.bookingByRange?.monthly ?? [],
          weekly: data.bookingByRange?.weekly ?? []
        };

    const bookingTotals = data.bookingMetricsByRange
      ? {
          monthly: monthlyComputed.total,
          weekly: weeklyComputed.total
        }
      : {
          monthly: data.bookingTotals?.monthly ?? 0,
          weekly: data.bookingTotals?.weekly ?? 0
        };

    const payload: DashboardPayload = {
      stats,
      monthlyData: data.monthlyData ?? [],
      weeklyData: data.weeklyData ?? [],
      bookingByRange,
      bookingTotals,
      vendors: data.vendors ?? []
    };

    return jsonOk(payload);
  } catch {
    return jsonError("Failed to read dashboard data");
  }
}
