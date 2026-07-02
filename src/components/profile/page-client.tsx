"use client";

import React, { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import {
  Camera,
  ChevronRight,
  Headphones,
  Lock,
  MapPin,
  Save,
} from "lucide-react";
import Link from "next/link";
import {
  uploadVendorProfileAvatar,
  vendorUpdateProfileSettings,
} from "@/lib/vendor-api";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export type ProfileSettingsData = {
  business_name?: string;
  category?: string;
  categories?: string[];
  phone_number?: string;
  email_address?: string;
  about_business?: string;
  website?: string;
  office_address?: string;
  latitude?: string | number;
  longitude?: string | number;
  location_label?: string;
  place_id?: string;
  avatar_url?: string;
};

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumberText(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item, index, array) => item && array.indexOf(item) === index);
}

const CATEGORY_OPTIONS = ["Restaurant", "Hotel", "Spa", "Event Venue"];

function buildStaticMapUrl(latitude: string, longitude: string): string | null {
  if (!GOOGLE_MAPS_API_KEY || !latitude || !longitude) {
    return null;
  }
  const params = new URLSearchParams({
    center: `${latitude},${longitude}`,
    zoom: "15",
    size: "1200x700",
    scale: "2",
    maptype: "roadmap",
    key: GOOGLE_MAPS_API_KEY,
  });
  params.append("markers", `color:red|${latitude},${longitude}`);
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

export function ProfilePageClient({
  initialData,
}: {
  initialData: ProfileSettingsData;
}) {
  const [formData, setFormData] = useState({
    businessName: asText(initialData.business_name),
    categories: (() => {
      const next = asStringArray(initialData.categories);
      if (next.length > 0) {
        return next;
      }
      return asText(initialData.category) ? [asText(initialData.category)] : ["Restaurant"];
    })(),
    contactPhone: asText(initialData.phone_number),
    contactEmail: asText(initialData.email_address),
    about: asText(initialData.about_business),
    website: asText(initialData.website),
    address: asText(initialData.office_address),
    latitude: asNumberText(initialData.latitude),
    longitude: asNumberText(initialData.longitude),
    locationLabel: asText(initialData.location_label),
    placeId: asText(initialData.place_id),
    avatarUrl: asText(initialData.avatar_url),
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);

  const staticMapUrl = useMemo(
    () => buildStaticMapUrl(formData.latitude, formData.longitude),
    [formData.latitude, formData.longitude],
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setStatusMessage("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleCategory = (category: string) => {
    setStatusMessage("");
    setFormData((prev) => {
      const next = prev.categories.includes(category)
        ? prev.categories.filter((item) => item !== category)
        : [...prev.categories, category];
      return {
        ...prev,
        categories: next.length > 0 ? next : prev.categories,
      };
    });
  };

  const handleAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploadingAvatar(true);
    setStatusMessage("");

    try {
      const uploadedUrl = await uploadVendorProfileAvatar(file);
      setFormData((prev) => ({ ...prev, avatarUrl: uploadedUrl }));
      setStatusMessage("Profile image uploaded.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to upload profile image.",
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleResolveLocation = async () => {
    if (!GOOGLE_MAPS_API_KEY) {
      setStatusMessage("Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to the service-provider app.");
      return;
    }
    if (!formData.address.trim()) {
      setStatusMessage("Enter the business address before finding coordinates.");
      return;
    }

    setIsResolvingLocation(true);
    setStatusMessage("");

    try {
      const params = new URLSearchParams({
        address: formData.address.trim(),
        key: GOOGLE_MAPS_API_KEY,
      });
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
      );
      const payload = (await response.json()) as {
        status?: string;
        results?: Array<{
          formatted_address?: string;
          place_id?: string;
          geometry?: { location?: { lat?: number; lng?: number } };
        }>;
      };
      const result = payload.results?.[0];
      const location = result?.geometry?.location;

      if (!response.ok || payload.status !== "OK" || !location) {
        throw new Error("Google Maps could not find coordinates for this address.");
      }

      setFormData((prev) => ({
        ...prev,
        address: result.formatted_address || prev.address,
        latitude: String(location.lat ?? ""),
        longitude: String(location.lng ?? ""),
        locationLabel: result.formatted_address || prev.locationLabel,
        placeId: result.place_id || prev.placeId,
      }));
      setStatusMessage("Coordinates updated from the business address.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to resolve location.",
      );
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage("");

    try {
      await vendorUpdateProfileSettings({
        business_name: formData.businessName.trim(),
        category: formData.categories[0] || "Restaurant",
        categories: formData.categories,
        email_address: formData.contactEmail.trim(),
        phone_number: formData.contactPhone.trim(),
        about_business: formData.about.trim(),
        office_address: formData.address.trim() || null,
        latitude: formData.latitude.trim() ? Number(formData.latitude) : null,
        longitude: formData.longitude.trim() ? Number(formData.longitude) : null,
        location_label: formData.locationLabel.trim() || null,
        place_id: formData.placeId.trim() || null,
        website: formData.website.trim() || null,
        map_embed_url: staticMapUrl,
        avatar_url: formData.avatarUrl || null,
      });
      setStatusMessage("Profile settings saved.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to save profile settings.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Header title="Business Profile" />

      <main className="flex-1 p-6 md:p-10 pb-32">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                Business Profile
              </h1>
              <p className="text-sm font-bold text-slate-400 mt-1">
                Manage how your business appears to potential clients.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving || isUploadingAvatar || isResolvingLocation}
              className="px-8 py-3.5 bg-[#1e2a5e] hover:bg-[#1a234d] disabled:opacity-60 text-white rounded-[24px] text-sm font-black flex items-center gap-2 shadow-xl shadow-[#1e2a5e]/20 transition-all"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
          {statusMessage ? (
            <p className="text-sm font-bold text-[#1e2a5e]">{statusMessage}</p>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
                <div className="flex flex-col items-center mb-10">
                  <div className="relative group">
                    <div className="h-32 w-32 rounded-full border-8 border-slate-50 overflow-hidden shadow-inner bg-slate-200">
                      {formData.avatarUrl ? (
                        <img
                          src={formData.avatarUrl}
                          alt="Profile avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex flex-col overflow-hidden">
                          <div className="h-1/2 bg-[#f59e0b]" />
                          <div className="h-1/2 bg-[#065f46]" />
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-1 right-1 h-10 w-10 bg-[#1e2a5e] text-white rounded-2xl flex items-center justify-center border-4 border-white shadow-lg hover:scale-110 transition-transform cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                      <Camera className="h-5 w-5" />
                    </label>
                  </div>
                  {isUploadingAvatar ? (
                    <p className="text-xs font-bold text-slate-400 mt-4">
                      Uploading profile image...
                    </p>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                      Business Name
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="w-full h-14 px-6 rounded-2xl border border-slate-200 bg-[#fbfcfe] focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100/80 transition-all outline-none text-sm font-medium text-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                      Categories
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {CATEGORY_OPTIONS.map((category) => {
                        const selected = formData.categories.includes(category);
                        return (
                          <button
                            key={category}
                            type="button"
                            onClick={() => toggleCategory(category)}
                            className={[
                              "h-14 rounded-2xl border px-4 text-sm font-bold transition-all",
                              selected
                                ? "border-sky-400 bg-sky-50 text-sky-700"
                                : "border-slate-200 bg-[#fbfcfe] text-slate-700 hover:border-sky-200 hover:bg-white",
                            ].join(" ")}
                          >
                            {category}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      className="w-full h-14 px-6 rounded-2xl border border-slate-200 bg-[#fbfcfe] focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100/80 transition-all outline-none text-sm font-medium text-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      className="w-full h-14 px-6 rounded-2xl border border-slate-200 bg-[#fbfcfe] focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100/80 transition-all outline-none text-sm font-medium text-slate-700"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                      About Business
                    </label>
                    <textarea
                      rows={5}
                      name="about"
                      value={formData.about}
                      onChange={handleInputChange}
                      className="w-full px-6 py-5 rounded-3xl border border-slate-200 bg-[#fbfcfe] focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100/80 transition-all outline-none text-sm font-medium text-slate-700 resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
                <div className="mb-8">
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">
                    Contact & Map
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Keep your contact details and map location accurate.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full h-14 px-6 rounded-2xl border border-slate-200 bg-[#fbfcfe] focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100/80 transition-all outline-none text-sm font-medium text-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                      Address
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="flex-1 h-14 px-6 rounded-2xl border border-slate-200 bg-[#fbfcfe] focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100/80 transition-all outline-none text-sm font-medium text-slate-700"
                      />
                      <button
                        type="button"
                        onClick={handleResolveLocation}
                        disabled={isResolvingLocation}
                        className="px-5 rounded-2xl border border-slate-200 bg-white text-slate-700 text-sm font-bold transition hover:border-sky-300 hover:text-sky-600 disabled:opacity-60"
                      >
                        {isResolvingLocation ? "Finding..." : "Find Map"}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                        Latitude
                      </label>
                      <input
                        type="text"
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleInputChange}
                        className="w-full h-14 px-6 rounded-2xl border border-slate-200 bg-[#fbfcfe] focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100/80 transition-all outline-none text-sm font-medium text-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                        Longitude
                      </label>
                      <input
                        type="text"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleInputChange}
                        className="w-full h-14 px-6 rounded-2xl border border-slate-200 bg-[#fbfcfe] focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100/80 transition-all outline-none text-sm font-medium text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-[#f9fbfd] overflow-hidden">
                    {staticMapUrl ? (
                      <img
                        src={staticMapUrl}
                        alt="Business location preview"
                        className="h-[320px] w-full object-cover"
                      />
                    ) : (
                      <div className="h-[320px] flex items-center justify-center text-slate-400 text-sm font-semibold">
                        Add a valid address or coordinates to preview the map.
                      </div>
                    )}
                    <div className="px-6 py-4 flex items-center gap-3 text-sm text-slate-500">
                      <MapPin className="h-4 w-4 text-sky-500" />
                      {formData.locationLabel || formData.address || "Location details not set yet."}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="bg-white rounded-[36px] p-8 border border-slate-100 shadow-sm">
                <h3 className="text-base font-black text-slate-800">Profile Shortcuts</h3>
                <div className="mt-6 space-y-3">
                  <Link
                    href="/settings"
                    className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:border-sky-300 hover:text-sky-600 transition"
                  >
                    Settings
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/profile/support"
                    className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:border-sky-300 hover:text-sky-600 transition"
                  >
                    Support Center
                    <Headphones className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/profile/legal/terms"
                    className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:border-sky-300 hover:text-sky-600 transition"
                  >
                    Legal
                    <Lock className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
