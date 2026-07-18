import { describe, expect, it } from "vitest";
import {
  extractVendorCategories,
  getFallbackRouteForCategories,
  isRouteAllowedForCategories,
} from "./vendor-access";

describe("vendor route access", () => {
  it("normalizes and de-duplicates provider categories", () => {
    expect(extractVendorCategories(["hotel", "Hotel", "Restaurant"])).toEqual(["Hotel", "Restaurant"]);
  });

  it("keeps hotel vendors out of restaurant-only routes", () => {
    expect(isRouteAllowedForCategories("/restaurant-bookings", ["Hotel"])).toBe(false);
    expect(isRouteAllowedForCategories("/hotel-bookings", ["Hotel"])).toBe(true);
  });

  it("selects a usable fallback for the vendor category", () => {
    expect(getFallbackRouteForCategories(["Hotel"])).toBe("/hotel-bookings");
  });
});
