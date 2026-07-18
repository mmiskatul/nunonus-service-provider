import { vendorRequest } from "@/lib/vendor-api";

function query(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const value = search.toString();
  return value ? `?${value}` : "";
}

export function vendorGetDashboardOverview() {
  return vendorRequest<Record<string, unknown>>("/vendor/dashboard/overview");
}

export function vendorGetBookingTrends() {
  return vendorRequest<Record<string, unknown>>("/vendor/dashboard/booking-trends");
}

export function vendorGetCalendarPreview(month?: string) {
  return vendorRequest<Record<string, unknown>>(`/vendor/dashboard/calendar-preview${query({ month })}`);
}

export function vendorGetUpcomingBookings(limit = 10) {
  return vendorRequest<Record<string, unknown>>(`/vendor/dashboard/upcoming-bookings${query({ limit })}`);
}

export function vendorGetRecentReviews(limit = 5) {
  return vendorRequest<Record<string, unknown>>(`/vendor/dashboard/recent-reviews${query({ limit })}`);
}
