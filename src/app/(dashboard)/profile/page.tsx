"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import {
  Camera,
  Lock,
  Headphones,
  ChevronRight,
  Save,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import {
  uploadVendorFile,
  vendorGetProfileSettings,
  vendorUpdateProfileSettings,
} from "@/lib/vendor-api";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

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

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    businessName: "",
    category: "Restaurant",
    contactPhone: "",
    contactEmail: "",
    about: "",
    website: "",
    address: "",
    latitude: "",
    longitude: "",
    locationLabel: "",
    placeId: "",
    avatarUrl: "",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const data = await vendorGetProfileSettings();
        if (!mounted) {
          return;
        }
        setFormData({
          businessName: asText(data.business_name),
          category: asText(data.category) || "Restaurant",
          contactPhone: asText(data.phone_number),
          contactEmail: asText(data.email_address),
          about: asText(data.about_business),
          website: asText(data.website),
          address: asText(data.office_address),
          latitude: asNumberText(data.latitude),
          longitude: asNumberText(data.longitude),
          locationLabel: asText(data.location_label),
          placeId: asText(data.place_id),
          avatarUrl: asText(data.avatar_url),
        });
      } catch (error) {
        if (mounted) {
          setStatusMessage(
            error instanceof Error ? error.message : "Failed to load profile settings.",
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

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
      const uploadedUrl = await uploadVendorFile(file);
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
        category: formData.category.trim(),
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col">
        <Header title="Business Profile" />
        <main className="flex-1 grid place-items-center p-6">
          <p className="text-sm font-bold text-slate-500">Loading profile...</p>
        </main>
      </div>
    );
  }

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
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm font-bold text-slate-700"
                      placeholder="e.g. Acme Services"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm font-bold text-slate-700 appearance-none"
                    >
                      <option>Retail</option>
                      <option>Restaurant</option>
                      <option>Hotel</option>
                      <option>Spa & Wellness</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
                <div className="mb-8">
                  <h3 className="text-xl font-black text-slate-800 mb-1">
                    About Business
                  </h3>
                </div>

                <textarea
                  name="about"
                  value={formData.about}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full p-8 bg-slate-50/50 border border-slate-100 rounded-[32px] focus:outline-none text-sm font-bold text-slate-500 leading-relaxed resize-none"
                  placeholder="Describe the business, the experience, and the services you provide."
                />
              </div>

              <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
                <div className="mb-8">
                  <h3 className="text-xl font-black text-slate-800 mb-1">
                    Contact & Location
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        name="contactPhone"
                        value={formData.contactPhone}
                        onChange={handleInputChange}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] transition-all text-sm font-bold text-slate-700"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="contactEmail"
                        value={formData.contactEmail}
                        onChange={handleInputChange}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] transition-all text-sm font-bold text-slate-700"
                        placeholder="business@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                        Website
                      </label>
                      <input
                        type="text"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] transition-all text-sm font-bold text-slate-700"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                        Office Address
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full p-6 bg-slate-50/50 border border-slate-100 rounded-[24px] focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm font-bold text-slate-700 resize-none"
                        placeholder="Enter the full business address"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                        Location Label
                      </label>
                      <input
                        type="text"
                        name="locationLabel"
                        value={formData.locationLabel}
                        onChange={handleInputChange}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] transition-all text-sm font-bold text-slate-700"
                        placeholder="e.g. West Bay, Doha"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                          Latitude
                        </label>
                        <input
                          type="text"
                          name="latitude"
                          value={formData.latitude}
                          onChange={handleInputChange}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] transition-all text-sm font-bold text-slate-700"
                          placeholder="25.2854"
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
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] transition-all text-sm font-bold text-slate-700"
                          placeholder="51.5310"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleResolveLocation}
                      disabled={isResolvingLocation}
                      className="w-full px-5 py-3 bg-[#1e2a5e] hover:bg-[#1a234d] disabled:opacity-60 text-white rounded-[18px] text-sm font-black transition-all"
                    >
                      {isResolvingLocation ? "Finding coordinates..." : "Use address to find coordinates"}
                    </button>

                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                        Google Place ID
                      </label>
                      <input
                        type="text"
                        name="placeId"
                        value={formData.placeId}
                        onChange={handleInputChange}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] transition-all text-sm font-bold text-slate-700"
                        placeholder="Auto-filled after location lookup"
                      />
                    </div>

                    <div className="relative group rounded-[32px] overflow-hidden bg-slate-100 aspect-video flex items-center justify-center">
                      {staticMapUrl ? (
                        <img
                          src={staticMapUrl}
                          className="absolute inset-0 w-full h-full object-cover"
                          alt="Business location map"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-100">
                          <MapPin className="h-8 w-8 text-[#1e2a5e]" />
                          <p className="px-6 text-center text-xs font-bold text-slate-500">
                            Add coordinates to preview the business location on the map.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
                <h3 className="text-lg font-black text-slate-800 mb-6 px-4">
                  Account Settings
                </h3>

                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-4 bg-slate-50/50 border border-slate-50 hover:border-sky-200 hover:bg-white rounded-[24px] transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-sky-500 transition-colors">
                        <Lock className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-black text-slate-700">
                        Change Password
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-all group-hover:translate-x-1" />
                  </button>

                  <Link
                    href="/profile/support"
                    className="w-full flex items-center justify-between p-4 bg-slate-50/50 border border-slate-50 hover:border-sky-200 hover:bg-white rounded-[24px] transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-sky-500 transition-colors">
                        <Headphones className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-black text-slate-700">
                        Support
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-all group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/profile/legal/terms"
                    className="w-full flex items-center justify-between p-4 px-6 hover:bg-slate-50/50 rounded-[20px] transition-all group"
                  >
                    <span className="text-sm font-bold text-slate-500 group-hover:text-slate-800">
                      Terms & Conditions
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-all group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/profile/legal/privacy"
                    className="w-full flex items-center justify-between p-4 px-6 hover:bg-slate-50/50 rounded-[20px] transition-all group"
                  >
                    <span className="text-sm font-bold text-slate-500 group-hover:text-slate-800">
                      Privacy Policy
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-all group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
