const EXACT_TITLES: Record<string, string> = {
  "/dashboard": "Business Overview",
  "/analytics": "Analytics",
  "/customers": "Customers",
  "/operations": "Operations",
  "/events": "Event Management",
  "/events/new": "Create Event",
  "/event-bookings": "Event Bookings",
  "/hotel-bookings": "Hotel Bookings",
  "/hotel-services": "Hotel / Services",
  "/hotel-services/add": "Add Hotel Room",
  "/hotel-services/add-service": "Add Hotel Service",
  "/loyalty": "Loyalty Program",
  "/notifications": "Notifications",
  "/profile": "Account Profile",
  "/profile/support": "Support & Help",
  "/promotions": "Promotions",
  "/promotions/new": "Create Promotion",
  "/restaurant-bookings": "Restaurant Bookings",
  "/reviews": "Reviews",
  "/services": "Restaurant / Services",
  "/settings": "Settings",
  "/settings/legal-content": "Legal Content",
  "/spa-bookings": "Spa Bookings",
  "/spa-services": "Spa / Services",
};

export function dashboardTitleForPath(pathname: string) {
  const normalized =
    pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (EXACT_TITLES[normalized]) return EXACT_TITLES[normalized];
  if (/^\/customers\/[^/]+$/.test(normalized)) return "Customer Details";
  if (/^\/events\/[^/]+$/.test(normalized)) return "Event Details";
  if (/^\/promotions\/[^/]+$/.test(normalized)) return "Promotion Details";
  if (/^\/hotel-services\/rooms\/[^/]+$/.test(normalized)) {
    return "Room Details";
  }
  if (/^\/hotel-services\/services\/[^/]+$/.test(normalized)) {
    return "Service Details";
  }
  if (/^\/profile\/support\/[^/]+$/.test(normalized)) {
    return "Support Ticket";
  }
  if (/^\/profile\/legal\/[^/]+$/.test(normalized)) {
    return "Legal Document";
  }
  return "Provider Dashboard";
}
