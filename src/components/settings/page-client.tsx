"use client";

import React, { useRef, useState } from "react";
import { Header } from "@/components/Header";
import { Bell, CalendarPlus2, Save, Shield, User, X } from "lucide-react";
import {
  vendorCreateEvent,
  vendorGetProfileSettings,
  vendorUpdateNotificationSettings,
  vendorUpdatePassword,
  vendorUpdateProfileSettings,
  uploadVendorFile,
  type VendorEventBookingMode,
  type VendorEventPayload,
  type VendorEventStatus,
} from "@/lib/vendor-api";
import { extractVendorCategories, type VendorCategory } from "@/lib/vendor-access";
import { buildSettingsProfilePayload } from "@/lib/vendor-contracts";

type SettingsTab = "profile" | "notifications" | "security";

type EventFormState = {
  title: string;
  category: VendorCategory;
  eventType: string;
  bookingMode: VendorEventBookingMode;
  eventDate: string;
  startTime: string;
  endTime: string;
  timezone: string;
  venue: string;
  capacity: string;
  ticketPrice: string;
  registrationDeadline: string;
  description: string;
  bannerImageUrl: string;
  status: VendorEventStatus;
};

export type SettingsProfileData = {
  business_name?: string;
  name?: string;
  category?: string;
  categories?: string[];
  phone_number?: string;
  phone?: string;
  email_address?: string;
  email?: string;
  office_address?: string;
  address?: string;
  about_business?: string;
  description?: string;
};

export type SettingsNotificationData = {
  new_booking?: boolean;
  booking_cancellation?: boolean;
  new_review?: boolean;
  platform_updates?: boolean;
};

const DEFAULT_CATEGORIES: VendorCategory[] = ["Restaurant"];

function getDefaultEventForm(categories: VendorCategory[]): EventFormState {
  return {
    title: "",
    category: categories[0] ?? "Restaurant",
    eventType: "",
    bookingMode: "simple",
    eventDate: "",
    startTime: "",
    endTime: "",
    timezone: "Asia/Dhaka",
    venue: "",
    capacity: "",
    ticketPrice: "",
    registrationDeadline: "",
    description: "",
    bannerImageUrl: "",
    status: "draft",
  };
}

function validateEventForm(form: EventFormState): string | null {
  if (!form.title.trim()) return "Event title is required.";
  if (!form.eventType.trim()) return "Event type is required.";
  if (!form.eventDate) return "Event date is required.";
  if (!form.startTime) return "Start time is required.";
  if (!form.endTime) return "End time is required.";
  if (form.endTime <= form.startTime) return "End time must be later than start time.";
  if (!form.venue.trim()) return "Location is required.";
  if (!form.capacity.trim() || Number(form.capacity) <= 0) return "Capacity must be greater than zero.";
  if (!form.ticketPrice.trim() || Number(form.ticketPrice) < 0) return "Ticket price must be zero or more.";
  if (!form.description.trim()) return "Description is required.";
  return null;
}

function toEventPayload(form: EventFormState): VendorEventPayload {
  return {
    title: form.title.trim(),
    category: form.category,
    event_type: form.eventType.trim(),
    booking_mode: form.bookingMode,
    event_date: form.eventDate,
    start_time: form.startTime,
    end_time: form.endTime,
    timezone: form.timezone.trim() || "Asia/Dhaka",
    venue: form.venue.trim(),
    capacity: Number(form.capacity),
    ticket_price: Number(form.ticketPrice),
    registration_deadline: form.registrationDeadline || null,
    description: form.description.trim(),
    banner_image_url: form.bannerImageUrl.trim() || null,
    active_status: true,
    status: form.status,
  };
}

export function SettingsPageClient({
  initialProfile,
  initialNotifications,
}: {
  initialProfile: SettingsProfileData;
  initialNotifications: SettingsNotificationData;
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [categories, setCategories] = useState<VendorCategory[]>(DEFAULT_CATEGORIES);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [eventSaving, setEventSaving] = useState(false);
  const [eventStatusMessage, setEventStatusMessage] = useState("");
  const [profileForm, setProfileForm] = useState({
    business_name: String(initialProfile.business_name ?? initialProfile.name ?? ""),
    phone: String(initialProfile.phone_number ?? initialProfile.phone ?? ""),
    email: String(initialProfile.email_address ?? initialProfile.email ?? ""),
    address: String(initialProfile.office_address ?? initialProfile.address ?? ""),
    description: String(initialProfile.about_business ?? initialProfile.description ?? ""),
  });
  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [notifForm, setNotifForm] = useState({
    new_booking: Boolean(initialNotifications.new_booking ?? true),
    booking_cancellation: Boolean(initialNotifications.booking_cancellation ?? true),
    new_review: Boolean(initialNotifications.new_review ?? true),
    platform_updates: Boolean(initialNotifications.platform_updates ?? false),
  });
  const [eventForm, setEventForm] = useState<EventFormState>(getDefaultEventForm(DEFAULT_CATEGORIES));
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const ensureCategoriesLoaded = async () => {
    if (categoriesLoaded) {
      return;
    }

    try {
      const profile = await vendorGetProfileSettings();
      const nextCategories = extractVendorCategories(profile.categories ?? profile.category);
      setCategories(nextCategories);
      setEventForm((current) => ({
        ...current,
        category: nextCategories.includes(current.category) ? current.category : nextCategories[0],
      }));
    } catch {
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setCategoriesLoaded(true);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await vendorUpdateProfileSettings(
        buildSettingsProfilePayload(
          profileForm,
          initialProfile.categories ?? initialProfile.category,
        ),
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    setPasswordError("");
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("Passwords don't match.");
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (!passwordForm.old_password.trim()) {
      setPasswordError("Enter your current password.");
      return;
    }
    try {
      setSaving(true);
      await vendorUpdatePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password,
      });
      setSaved(true);
      setPasswordForm({ old_password: "", new_password: "", confirm_password: "" });
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setPasswordError((err as Error).message ?? "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      await vendorUpdateNotificationSettings(notifForm as Record<string, unknown>);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save notification settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const closeCreateEventModal = () => {
    setShowCreateEventModal(false);
    setEventStatusMessage("");
    setEventForm(getDefaultEventForm(categories));
  };

  const openCreateEventModal = () => {
    setShowCreateEventModal(true);
    setEventStatusMessage("");
    setEventForm(getDefaultEventForm(categories));
    void ensureCategoriesLoaded();
  };

  const handleBannerUpload = async (file: File | null) => {
    if (!file) {
      return;
    }

    try {
      setEventStatusMessage("Uploading banner image...");
      const url = await uploadVendorFile(file);
      setEventForm((current) => ({ ...current, bannerImageUrl: url }));
      setEventStatusMessage("Banner image uploaded.");
    } catch (error) {
      setEventStatusMessage(
        error instanceof Error ? error.message : "Failed to upload banner image.",
      );
    }
  };

  const handleCreateEvent = async () => {
    const validationError = validateEventForm(eventForm);
    if (validationError) {
      setEventStatusMessage(validationError);
      return;
    }

    setEventSaving(true);
    setEventStatusMessage("");
    try {
      await vendorCreateEvent(toEventPayload(eventForm));
      setEventStatusMessage("Event created.");
      setTimeout(() => {
        closeCreateEventModal();
      }, 500);
    } catch (error) {
      setEventStatusMessage(
        error instanceof Error ? error.message : "Failed to create event.",
      );
    } finally {
      setEventSaving(false);
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Business Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Password & Security", icon: Shield },
  ];

  return (
    <div className="min-h-full bg-[#f8fafc] flex flex-col">
      <Header title="Settings" />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl mx-auto space-y-7">
          <div className="flex gap-2 overflow-x-auto bg-white border border-slate-200 rounded-2xl p-2 shadow-sm">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex min-w-[170px] items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all flex-1 justify-center ${
                  activeTab === id
                    ? "bg-sky-500 text-white shadow"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-800 mb-1">Business Profile</h2>
                    <p className="text-sm text-slate-400">Update your business information visible to customers.</p>
                  </div>
                  <button
                    onClick={openCreateEventModal}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e2a5e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1a2552]"
                  >
                    <CalendarPlus2 className="h-4 w-4" />
                    Create Event
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "business_name", label: "Business Name", type: "text" },
                    { key: "phone", label: "Phone", type: "tel" },
                    { key: "email", label: "Email", type: "email" },
                    { key: "address", label: "Address", type: "text" },
                  ].map(({ key, label, type }) => (
                    <div key={key}>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">{label}</label>
                      <input
                        type={type}
                        value={profileForm[key as keyof typeof profileForm]}
                        onChange={(e) => setProfileForm((f) => ({ ...f, [key]: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100 transition"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Description</label>
                  <textarea
                    value={profileForm.description}
                    onChange={(e) => setProfileForm((f) => ({ ...f, description: e.target.value }))}
                    rows={4}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-400 resize-none transition"
                  />
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
                </button>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-800 mb-1">Notification Preferences</h2>
                  <p className="text-sm text-slate-400">Choose which updates you want to receive.</p>
                </div>
                {[
                  { key: "new_booking", label: "New Bookings", description: "Alert when a new booking is made" },
                  { key: "booking_cancellation", label: "Booking Cancellations", description: "Alert when a booking is cancelled" },
                  { key: "new_review", label: "New Reviews", description: "Alert when a customer leaves a review" },
                  { key: "platform_updates", label: "Platform Updates", description: "News and product updates from Nunonas" },
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div>
                      <p className="text-sm font-bold text-slate-700">{label}</p>
                      <p className="text-xs text-slate-400">{description}</p>
                    </div>
                    <button
                      onClick={() => setNotifForm((f) => ({ ...f, [key]: !f[key as keyof typeof notifForm] }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifForm[key as keyof typeof notifForm] ? "bg-sky-500" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          notifForm[key as keyof typeof notifForm] ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : saved ? "Saved!" : "Save Preferences"}
                </button>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-800 mb-1">Password & Security</h2>
                  <p className="text-sm text-slate-400">Update your password to keep your account secure.</p>
                </div>
                {passwordError && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600">
                    {passwordError}
                  </div>
                )}
                <div className="space-y-4">
                  {[
                    { key: "old_password", label: "Current Password" },
                    { key: "new_password", label: "New Password" },
                    { key: "confirm_password", label: "Confirm New Password" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">{label}</label>
                      <input
                        type="password"
                        value={passwordForm[key as keyof typeof passwordForm]}
                        onChange={(e) => setPasswordForm((f) => ({ ...f, [key]: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-400 transition"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleSavePassword}
                  disabled={saving}
                  className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition disabled:opacity-60"
                >
                  <Shield className="h-4 w-4" />
                  {saving ? "Updating..." : saved ? "Updated!" : "Update Password"}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {showCreateEventModal ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm">
          <div className="flex h-[100dvh] w-screen flex-col bg-white">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5 md:px-10">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Event Creator
                </p>
                <h3 className="mt-2 text-3xl font-black text-slate-800">Create Event</h3>
                <p className="mt-2 max-w-2xl text-sm text-slate-400">
                  Fill in every event detail here. The preview updates as you type.
                </p>
              </div>
              <button
                onClick={closeCreateEventModal}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                aria-label="Close create event modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-[360px,1fr]">
              <aside className="border-b border-slate-100 bg-slate-50/60 p-6 lg:border-b-0 lg:border-r lg:p-8">
                <div className="sticky top-0 space-y-6">
                  {!categoriesLoaded ? (
                    <div className="rounded-[28px] border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500">
                      Loading category options...
                    </div>
                  ) : null}
                  <div className="rounded-[28px] bg-[#1e2a5e] p-6 text-white shadow-xl shadow-slate-900/10">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">
                      Live Preview
                    </p>
                    <h4 className="mt-3 text-2xl font-black leading-tight">
                      {eventForm.title || "Event title will appear here"}
                    </h4>
                    <p className="mt-2 text-sm text-white/75">
                      {eventForm.eventType || "Event type"} in{" "}
                      {eventForm.venue || "your selected location"}
                    </p>
                    <div className="mt-5 space-y-2 text-sm text-white/80">
                      <p>Date: {eventForm.eventDate || "Not selected"}</p>
                      <p>
                        Time: {eventForm.startTime || "--:--"} to {eventForm.endTime || "--:--"}
                      </p>
                      <p>Capacity: {eventForm.capacity || "0"}</p>
                      <p>Ticket: {eventForm.ticketPrice || "0"}</p>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <h4 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                      Event Details
                    </h4>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <SummaryRow label="Category" value={eventForm.category} />
                      <SummaryRow label="Timezone" value={eventForm.timezone || "Asia/Dhaka"} />
                      <SummaryRow label="Registration Deadline" value={eventForm.registrationDeadline || "Not set"} />
                      <SummaryRow label="Status" value={eventForm.status} />
                      <SummaryRow label="Banner URL" value={eventForm.bannerImageUrl || "Not set"} />
                    </div>
                  </div>
                </div>
              </aside>

              <div className="flex min-h-0 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-8">
                  {eventStatusMessage ? (
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                      {eventStatusMessage}
                    </div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Event Title">
                  <input
                    value={eventForm.title}
                    onChange={(event) => setEventForm((current) => ({ ...current, title: event.target.value }))}
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                    placeholder="Summer Food Festival"
                  />
                </Field>
                <Field label="Category">
                  <select
                    value={eventForm.category}
                    onChange={(event) =>
                      setEventForm((current) => ({
                        ...current,
                        category: event.target.value as VendorCategory,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Event Type">
                  <input
                    value={eventForm.eventType}
                    onChange={(event) => setEventForm((current) => ({ ...current, eventType: event.target.value }))}
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                    placeholder="Dinner, Concert, Workshop"
                  />
                </Field>
                <Field label="Booking Flow">
                  <select
                    value={eventForm.bookingMode}
                    onChange={(event) =>
                      setEventForm((current) => ({
                        ...current,
                        bookingMode: event.target.value as VendorEventBookingMode,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                  >
                    <option value="simple">Simple map booking</option>
                    <option value="detailed">Detailed booking page</option>
                  </select>
                </Field>
                <Field label="Location">
                  <input
                    value={eventForm.venue}
                    onChange={(event) => setEventForm((current) => ({ ...current, venue: event.target.value }))}
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                    placeholder="Main Hall"
                  />
                </Field>
                <Field label="Event Date">
                  <input
                    type="date"
                    value={eventForm.eventDate}
                    onChange={(event) => setEventForm((current) => ({ ...current, eventDate: event.target.value }))}
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                  />
                </Field>
                <Field label="Timezone">
                  <input
                    value={eventForm.timezone}
                    onChange={(event) => setEventForm((current) => ({ ...current, timezone: event.target.value }))}
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                    placeholder="Asia/Dhaka"
                  />
                </Field>
                <Field label="Start Time">
                  <input
                    type="time"
                    value={eventForm.startTime}
                    onChange={(event) => setEventForm((current) => ({ ...current, startTime: event.target.value }))}
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                  />
                </Field>
                <Field label="End Time">
                  <input
                    type="time"
                    value={eventForm.endTime}
                    onChange={(event) => setEventForm((current) => ({ ...current, endTime: event.target.value }))}
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                  />
                </Field>
                <Field label="Capacity">
                  <input
                    type="number"
                    min="1"
                    value={eventForm.capacity}
                    onChange={(event) => setEventForm((current) => ({ ...current, capacity: event.target.value }))}
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                    placeholder="100"
                  />
                </Field>
                <Field label="Ticket Price">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={eventForm.ticketPrice}
                    onChange={(event) => setEventForm((current) => ({ ...current, ticketPrice: event.target.value }))}
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                    placeholder="25"
                  />
                </Field>
                <Field label="Registration Deadline">
                  <input
                    type="datetime-local"
                    value={eventForm.registrationDeadline}
                    onChange={(event) =>
                      setEventForm((current) => ({
                        ...current,
                        registrationDeadline: event.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                  />
                </Field>
                <Field label="Banner Image">
                  <div className="space-y-3">
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        void handleBannerUpload(event.target.files?.[0] ?? null);
                        event.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      <CalendarPlus2 className="h-4 w-4" />
                      {eventForm.bannerImageUrl ? "Replace Banner" : "Upload Banner"}
                    </button>
                    {eventForm.bannerImageUrl ? (
                      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                        <img
                          src={eventForm.bannerImageUrl}
                          alt="Banner preview"
                          className="h-40 w-full object-cover"
                        />
                        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
                          <p className="truncate text-xs font-semibold text-slate-500">
                            Banner uploaded
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setEventForm((current) => ({ ...current, bannerImageUrl: "" }))
                            }
                            className="text-xs font-bold text-rose-600"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-medium text-slate-400">
                        Upload a JPG or PNG banner image.
                      </p>
                    )}
                  </div>
                </Field>
                <Field label="Status">
                  <select
                    value={eventForm.status}
                    onChange={(event) =>
                      setEventForm((current) => ({
                        ...current,
                        status: event.target.value as VendorEventStatus,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                    <option value="cancelled">Cancelled</option>
                    </select>
                </Field>
                  </div>

                  <Field label="Description">
                    <textarea
                      value={eventForm.description}
                      onChange={(event) =>
                        setEventForm((current) => ({ ...current, description: event.target.value }))
                      }
                      rows={8}
                      className="w-full rounded-[20px] border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                      placeholder="Describe the event, guest experience, schedule, and important notes."
                    />
                  </Field>
                </div>

                <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-5 md:px-8">
                  <button
                    onClick={closeCreateEventModal}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void handleCreateEvent()}
                    disabled={eventSaving}
                    className="rounded-2xl bg-[#1e2a5e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1a2552] disabled:opacity-60"
                  >
                    {eventSaving ? "Creating..." : "Create Event"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span className="max-w-[180px] text-right text-sm font-semibold text-slate-700">
        {value}
      </span>
    </div>
  );
}
