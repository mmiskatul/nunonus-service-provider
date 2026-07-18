import { queryOptions } from "@tanstack/react-query";
import {
  vendorGetProfileSettings,
  vendorListNotifications,
  vendorGetAnalyticsOverview,
  vendorGetUser,
  vendorGetPromotion,
} from "@/lib/vendor-api";
import {
  vendorGetBookingTrends,
  vendorGetCalendarPreview,
  vendorGetDashboardOverview,
  vendorGetRecentReviews,
  vendorGetUpcomingBookings,
} from "@/lib/vendor-dashboard-api";

export const vendorQueryKeys = {
  all: ["vendor"] as const,
  profile: ["vendor", "profile"] as const,
  dashboard: ["vendor", "dashboard"] as const,
  dashboardOverview: ["vendor", "dashboard", "overview"] as const,
  bookingTrends: ["vendor", "dashboard", "booking-trends"] as const,
  calendar: (month: string) => ["vendor", "dashboard", "calendar", month] as const,
  upcomingBookings: (limit: number) => ["vendor", "dashboard", "upcoming-bookings", limit] as const,
  recentReviews: (limit: number) => ["vendor", "dashboard", "recent-reviews", limit] as const,
  notifications: (limit: number, skip: number) => ["vendor", "notifications", limit, skip] as const,
  customer: (id: string) => ["vendor", "customer", id] as const,
  promotion: (id: string) => ["vendor", "promotion", id] as const,
};

export const vendorProfileQuery = () =>
  queryOptions({
    queryKey: vendorQueryKeys.profile,
    queryFn: vendorGetProfileSettings,
    staleTime: 5 * 60_000,
  });

export const dashboardOverviewQuery = () =>
  queryOptions({ queryKey: vendorQueryKeys.dashboardOverview, queryFn: vendorGetDashboardOverview });

export const bookingTrendsQuery = () =>
  queryOptions({ queryKey: vendorQueryKeys.bookingTrends, queryFn: vendorGetBookingTrends });

export const calendarPreviewQuery = (month: string) =>
  queryOptions({
    queryKey: vendorQueryKeys.calendar(month),
    queryFn: () => vendorGetCalendarPreview(month),
  });

export const upcomingBookingsQuery = (limit = 10) =>
  queryOptions({
    queryKey: vendorQueryKeys.upcomingBookings(limit),
    queryFn: () => vendorGetUpcomingBookings(limit),
  });

export const recentReviewsQuery = (limit = 5) =>
  queryOptions({
    queryKey: vendorQueryKeys.recentReviews(limit),
    queryFn: () => vendorGetRecentReviews(limit),
  });

export const notificationsQuery = (limit = 20, skip = 0) =>
  queryOptions({
    queryKey: vendorQueryKeys.notifications(limit, skip),
    queryFn: () => vendorListNotifications({ limit, skip }),
  });

export const analyticsOverviewQuery = () =>
  queryOptions({ queryKey: ["vendor", "analytics", "overview"] as const, queryFn: vendorGetAnalyticsOverview, staleTime: 60_000 });

export const customerQuery = (id: string) =>
  queryOptions({ queryKey: vendorQueryKeys.customer(id), queryFn: () => vendorGetUser(id), enabled: Boolean(id), staleTime: 5 * 60_000 });

export const promotionQuery = (id: string) =>
  queryOptions({ queryKey: vendorQueryKeys.promotion(id), queryFn: () => vendorGetPromotion(id), enabled: Boolean(id), staleTime: 60_000 });
