"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Camera,
  ChevronRight,
  Globe2,
  Headphones,
  Lock,
  Mail,
  MapPin,
  Phone,
  Settings,
  UserRound,
} from "lucide-react";
import { Header } from "@/components/Header";
import { uploadVendorProfileAvatar } from "@/lib/vendor-api";
import { vendorQueryKeys } from "@/lib/vendor-queries";

export type ProfileSettingsData = {
  business_name?: string;
  name?: string;
  owner_full_name?: string;
  category?: string;
  categories?: string[];
  phone_number?: string;
  phone?: string;
  email_address?: string;
  email?: string;
  about_business?: string;
  description?: string;
  website?: string;
  office_address?: string;
  address?: string;
  location_label?: string;
  avatar_url?: string;
  profile_image_url?: string;
};

function text(...values: unknown[]) {
  const value = values.find(
    (item) => typeof item === "string" && item.trim().length > 0,
  );
  return typeof value === "string" ? value.trim() : "";
}

function profileCategories(data: ProfileSettingsData) {
  const values = Array.isArray(data.categories)
    ? data.categories
    : [data.category];
  return values
    .map((value) => text(value))
    .filter(
      (value, index, categories) =>
        Boolean(value) && categories.indexOf(value) === index,
    );
}

export function ProfilePageClient({
  initialData,
}: {
  initialData: ProfileSettingsData;
}) {
  const queryClient = useQueryClient();
  const [avatarUrl, setAvatarUrl] = useState(() =>
    text(initialData.avatar_url, initialData.profile_image_url),
  );
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const businessName = text(
    initialData.business_name,
    initialData.name,
    "Business",
  );
  const ownerName = text(initialData.owner_full_name, "Owner not provided");
  const email = text(
    initialData.email_address,
    initialData.email,
    "Email not provided",
  );
  const phone = text(
    initialData.phone_number,
    initialData.phone,
    "Phone not provided",
  );
  const address = text(
    initialData.office_address,
    initialData.address,
    initialData.location_label,
    "Location not provided",
  );
  const locationLabel = text(initialData.location_label, address);
  const description = text(
    initialData.about_business,
    initialData.description,
    "No business description has been added.",
  );
  const website = text(initialData.website);
  const categories = profileCategories(initialData);

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setStatusMessage("");
    try {
      await queryClient.cancelQueries({ queryKey: vendorQueryKeys.profile });
      const uploadedUrl = await uploadVendorProfileAvatar(file);
      setAvatarUrl(uploadedUrl);
      queryClient.setQueryData(
        vendorQueryKeys.profile,
        (current: Record<string, unknown> | undefined) => ({
          ...(current ?? initialData),
          avatar_url: uploadedUrl,
        }),
      );
      setStatusMessage("Profile image updated.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Failed to upload profile image.",
      );
    } finally {
      setUploading(false);
    }
  };

  const details = [
    { label: "Owner / contact", value: ownerName, icon: UserRound },
    { label: "Email", value: email, icon: Mail },
    { label: "Phone", value: phone, icon: Phone },
    { label: "Business address", value: address, icon: MapPin },
    ...(website
      ? [{ label: "Website", value: website, icon: Globe2 }]
      : []),
  ];

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <Header title="Account Profile" />
      <main className="w-full space-y-7 px-4 py-6 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex min-w-0 items-center gap-5">
            <div className="relative shrink-0">
              <div className="h-24 w-24 overflow-hidden rounded-3xl border-4 border-slate-50 bg-slate-100 shadow-sm">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={`${businessName} profile`}
                    width={96}
                    height={96}
                    sizes="96px"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-[#1e2a5e] text-2xl font-black text-white">
                    {businessName.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl border-4 border-white bg-sky-500 text-white shadow-lg transition hover:bg-sky-600">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={handleAvatarUpload}
                />
                <Camera className="h-4 w-4" />
              </label>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-500">
                Canonical provider account
              </p>
              <h1 className="mt-1 truncate text-2xl font-black text-slate-900 sm:text-3xl">
                {businessName}
              </h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {ownerName}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(categories.length ? categories : ["Category not provided"]).map(
                  (category) => (
                    <span
                      key={category}
                      className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700"
                    >
                      {category}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
          <Link
            href="/settings"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#1e2a5e] px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition hover:bg-[#263675]"
          >
            <Settings className="h-4 w-4" />
            Edit business settings
          </Link>
        </section>

        {statusMessage ? (
          <p
            role="status"
            className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-800"
          >
            {uploading ? "Uploading profile image…" : statusMessage}
          </p>
        ) : uploading ? (
          <p
            role="status"
            className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-800"
          >
            Uploading profile image…
          </p>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Account information
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                This summary is read from the same provider profile used by
                Settings and customer listings.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {details.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {label}
                    </p>
                    <p className="mt-1 break-words text-sm font-bold text-slate-700">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                <Building2 className="h-4 w-4 text-sky-500" />
                About the business
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {description}
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  Public location
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-900">
                  {locationLabel}
                </p>
              </div>
            </div>
          </section>

          <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Account links
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Open the section that owns the information you need to change.
              </p>
            </div>
            {[
              {
                href: "/settings",
                label: "Business settings",
                description: "Profile, services, security, and notifications",
                icon: Settings,
              },
              {
                href: "/profile/support",
                label: "Support center",
                description: "Create and follow support requests",
                icon: Headphones,
              },
              {
                href: "/profile/legal/terms",
                label: "Legal documents",
                description: "Terms and privacy information",
                icon: Lock,
              },
            ].map(({ href, label, description: itemDescription, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 rounded-2xl border border-slate-100 p-4 transition hover:border-sky-200 hover:bg-sky-50/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 group-hover:bg-white group-hover:text-sky-600">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-black text-slate-800">
                    {label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                    {itemDescription}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-sky-500" />
              </Link>
            ))}
          </aside>
        </div>
      </main>
    </div>
  );
}
