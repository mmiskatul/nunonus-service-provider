import { extractVendorCategories } from "./vendor-access";

export type SettingsProfileDraft = {
  business_name: string;
  phone: string;
  email: string;
  address: string;
  description: string;
};

export function buildSettingsProfilePayload(
  draft: SettingsProfileDraft,
  categoryInput: unknown,
): Record<string, unknown> {
  const categories = extractVendorCategories(categoryInput);
  return {
    business_name: draft.business_name.trim(),
    category: categories[0],
    categories,
    email_address: draft.email.trim(),
    phone_number: draft.phone.trim(),
    about_business: draft.description.trim(),
    office_address: draft.address.trim() || null,
  };
}
