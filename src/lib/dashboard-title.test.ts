import { describe, expect, it } from "vitest";
import { dashboardTitleForPath } from "./dashboard-title";

describe("dashboardTitleForPath", () => {
  it("maps top-level management pages", () => {
    expect(dashboardTitleForPath("/dashboard")).toBe("Business Overview");
    expect(dashboardTitleForPath("/spa-bookings")).toBe("Spa Bookings");
  });

  it("maps dynamic detail pages", () => {
    expect(dashboardTitleForPath("/customers/customer-id")).toBe(
      "Customer Details",
    );
    expect(dashboardTitleForPath("/events/event-id")).toBe("Event Details");
    expect(dashboardTitleForPath("/profile/support/ticket-id")).toBe(
      "Support Ticket",
    );
  });
});
