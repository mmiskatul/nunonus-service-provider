import { describe, expect, it } from "vitest";
import { buildSettingsProfilePayload } from "./vendor-contracts";

describe("vendor API payload contracts", () => {
  it("maps the settings form to the canonical backend profile schema", () => {
    expect(buildSettingsProfilePayload({
      business_name: " Nuno Hotel ",
      phone: " +8801000000000 ",
      email: " owner@example.com ",
      address: " Dhaka ",
      description: " Boutique hotel ",
    }, ["hotel"])).toEqual({
      business_name: "Nuno Hotel",
      category: "Hotel",
      categories: ["Hotel"],
      email_address: "owner@example.com",
      phone_number: "+8801000000000",
      about_business: "Boutique hotel",
      office_address: "Dhaka",
    });
  });
});
