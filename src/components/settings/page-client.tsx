"use client";

import React, { useEffect, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { useToast } from "@/components/ui/ToastProvider";
import { Bell, CalendarPlus2, Save, Shield, User, X, Hotel, Utensils, Sparkles, ClipboardCheck } from "lucide-react";
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

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

type SettingsTab = "profile" | "notifications" | "security" | "onboarding";

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
  owner_full_name?: string;
  location_label?: string;
  latitude?: number | null;
  longitude?: number | null;
  restaurant_settings?: Record<string, any>;
  hotel_settings?: Record<string, any>;
  spa_settings?: Record<string, any>;
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

const SERVICE_HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
const SERVICE_MINUTES = ["00", "15", "30", "45"];
const SERVICE_PERIODS = ["AM", "PM"];

function splitServiceTime(value: string) {
  const match = String(value || "").match(/^(?:(\d{1,2})(?::(\d{2}))?)(?:\s*(AM|PM))?$/i);
  return { hour: match?.[1]?.padStart(2, "0") ?? "", minute: match?.[2] ?? "", period: match?.[3]?.toUpperCase() ?? "" };
}

function setServiceTimePart(value: string, part: "hour" | "minute" | "period", next: string) {
  const current = splitServiceTime(value);
  const updated = { ...current, [part]: next };
  if (!updated.hour) return "";
  if (!updated.minute) return updated.hour;
  return `${updated.hour}:${updated.minute}${updated.period ? ` ${updated.period}` : ""}`;
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
  const { toast } = useToast();
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
    owner_full_name: String(initialProfile.owner_full_name ?? ""),
    location_label: String(initialProfile.location_label ?? ""),
  });
  const [serviceTab, setServiceTab] = useState<"restaurant" | "hotel" | "spa">("restaurant");
  const [serviceSettings, setServiceSettings] = useState({
    restaurant: { name: initialProfile.restaurant_settings?.name ?? "", address: initialProfile.restaurant_settings?.address ?? "", city: initialProfile.restaurant_settings?.city ?? "", phone: initialProfile.restaurant_settings?.phone ?? "", email: initialProfile.restaurant_settings?.email ?? "", latitude: initialProfile.restaurant_settings?.latitude ?? "", longitude: initialProfile.restaurant_settings?.longitude ?? "", about: initialProfile.restaurant_settings?.about ?? "", opening_time: initialProfile.restaurant_settings?.opening_time ?? "", closing_time: initialProfile.restaurant_settings?.closing_time ?? "", policy: initialProfile.restaurant_settings?.policy ?? "", amenities: initialProfile.restaurant_settings?.amenities ?? [] },
    hotel: { name: initialProfile.hotel_settings?.name ?? "", address: initialProfile.hotel_settings?.address ?? "", city: initialProfile.hotel_settings?.city ?? "", phone: initialProfile.hotel_settings?.phone ?? "", email: initialProfile.hotel_settings?.email ?? "", latitude: initialProfile.hotel_settings?.latitude ?? "", longitude: initialProfile.hotel_settings?.longitude ?? "", about: initialProfile.hotel_settings?.about ?? "", opening_time: initialProfile.hotel_settings?.opening_time ?? "", closing_time: initialProfile.hotel_settings?.closing_time ?? "", policy: initialProfile.hotel_settings?.policy ?? "", amenities: initialProfile.hotel_settings?.amenities ?? [] },
    spa: { name: initialProfile.spa_settings?.name ?? "", address: initialProfile.spa_settings?.address ?? "", city: initialProfile.spa_settings?.city ?? "", phone: initialProfile.spa_settings?.phone ?? "", email: initialProfile.spa_settings?.email ?? "", latitude: initialProfile.spa_settings?.latitude ?? "", longitude: initialProfile.spa_settings?.longitude ?? "", about: initialProfile.spa_settings?.about ?? "", opening_time: initialProfile.spa_settings?.opening_time ?? "", closing_time: initialProfile.spa_settings?.closing_time ?? "", policy: initialProfile.spa_settings?.policy ?? "", amenities: initialProfile.spa_settings?.amenities ?? [] },
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
  const locationMapRef = useRef<HTMLDivElement>(null);
  const locationMapInstance = useRef<any>(null);
  const locationMarkerInstance = useRef<any>(null);
  const [locationMapOpen, setLocationMapOpen] = useState(false);
  const configuredCategories = extractVendorCategories(initialProfile.categories ?? initialProfile.category);
  const availableServiceTabs = (['restaurant', 'hotel', 'spa'] as const).filter((service) => {
    const categoryText = configuredCategories.join(" ").toLowerCase();
    return categoryText.includes(service);
  });
  const visibleServiceTabs = availableServiceTabs.length ? availableServiceTabs : ["restaurant" as const];
  const activeServiceTab = visibleServiceTabs.includes(serviceTab) ? serviceTab : visibleServiceTabs[0];

  useEffect(() => {
    if (!locationMapOpen || !locationMapRef.current || !GOOGLE_MAPS_API_KEY) return;
    const initialize = () => {
      const google = (window as any).google;
      if (!google || !locationMapRef.current) return;
      const current = serviceSettings[activeServiceTab];
      const center = { lat: Number(current.latitude) || 23.8103, lng: Number(current.longitude) || 90.4125 };
      const map = new google.maps.Map(locationMapRef.current, { center, zoom: 14, mapTypeControl: false });
      const marker = new google.maps.Marker({ position: center, map, draggable: true });
      const update = (lat: number, lng: number, ref: any) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: ref }, (results: any, status: string) => {
          const address = status === "OK" && results?.[0] ? results[0].formatted_address : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setServiceSettings((state) => ({ ...state, [activeServiceTab]: { ...state[activeServiceTab], latitude: String(lat), longitude: String(lng), address } }));
        });
      };
      map.addListener("click", (event: any) => { marker.setPosition(event.latLng); update(event.latLng.lat(), event.latLng.lng(), event.latLng); });
      marker.addListener("dragend", () => { const position = marker.getPosition(); if (position) update(position.lat(), position.lng(), position); });
      locationMapInstance.current = map;
      locationMarkerInstance.current = marker;
    };
    if ((window as any).google?.maps) { initialize(); return; }
    const scriptId = "provider-google-maps-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) { script = document.createElement("script"); script.id = scriptId; script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`; script.async = true; script.defer = true; document.head.appendChild(script); }
    script.addEventListener("load", initialize);
    return () => script?.removeEventListener("load", initialize);
  }, [locationMapOpen, activeServiceTab]);

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
        {
          ...buildSettingsProfilePayload(
          profileForm,
          initialProfile.categories ?? initialProfile.category,
          ),
          owner_full_name: profileForm.owner_full_name,
          location_label: profileForm.location_label,
          restaurant_settings: serviceSettings.restaurant,
          hotel_settings: serviceSettings.hotel,
          spa_settings: serviceSettings.spa,
        },
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
    { id: "onboarding", label: "Onboarding", icon: ClipboardCheck },
  ];

  return (
    <div className="min-h-full bg-[#f8fafc] flex flex-col">
      <Header title="Settings" />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full space-y-7">
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
                    { key: "owner_full_name", label: "Owner / Contact Name", type: "text" },
                    { key: "phone", label: "Phone", type: "tel" },
                    { key: "email", label: "Email", type: "email" },
                    { key: "address", label: "Address", type: "text" },
                    { key: "location_label", label: "Public Location Label", type: "text" },
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
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-slate-800">Service-specific settings</h3>
                      <p className="text-xs text-slate-500">These details are shown for the selected service type. New rooms and services inherit the saved business location above.</p>
                    </div>
                    <div className="flex gap-2 rounded-xl bg-white p-1">
                      {([
                        ["restaurant", "Restaurant", Utensils],
                        ["hotel", "Hotel", Hotel],
                        ["spa", "Spa", Sparkles],
                      ] as const).filter(([id]) => visibleServiceTabs.includes(id)).map(([id, label, Icon]) => (
                        <button key={id} type="button" onClick={() => setServiceTab(id)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold ${activeServiceTab === id ? "bg-[#1e2a5e] text-white" : "text-slate-500 hover:bg-slate-100"}`}>
                          <Icon className="h-3.5 w-3.5" /> {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {(["name", "city", "phone", "email"] as const).map((field) => (
                      <label key={field} className="block"><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">{field.replace("_", " ")}</span><input value={serviceSettings[activeServiceTab][field]} onChange={(e) => setServiceSettings((current) => ({ ...current, [activeServiceTab]: { ...current[activeServiceTab], [field]: e.target.value } }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-400" placeholder={`Enter ${field.replace("_", " ")}`} /></label>
                    ))}
                    <div className="md:col-span-2"><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Location</span><div className="flex flex-wrap items-center gap-3"><input readOnly value={serviceSettings[activeServiceTab].address} placeholder="Choose this service location from the map" className="min-w-[240px] flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600" /><button type="button" onClick={() => setLocationMapOpen(true)} className="rounded-xl bg-[#1e2a5e] px-4 py-3 text-sm font-bold text-white">Choose on map</button></div></div>
                    <label className="block md:col-span-2"><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">About this {activeServiceTab}</span><textarea rows={3} value={serviceSettings[activeServiceTab].about} onChange={(e) => setServiceSettings((current) => ({ ...current, [activeServiceTab]: { ...current[activeServiceTab], about: e.target.value } }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-400" placeholder={`Describe your ${activeServiceTab} offering`} /></label>
                    <label className="block md:col-span-2"><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Amenities</span><input value={serviceSettings[activeServiceTab].amenities.join(", ")} onChange={(e) => setServiceSettings((current) => ({ ...current, [activeServiceTab]: { ...current[activeServiceTab], amenities: e.target.value.split(",").map((item) => item.trim()).filter(Boolean) } }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-400" placeholder="Free WiFi, Parking, Outdoor seating" /></label>
                    <TimeSelects label="Open time" value={serviceSettings[activeServiceTab].opening_time} onChange={(value) => setServiceSettings((current) => ({ ...current, [activeServiceTab]: { ...current[activeServiceTab], opening_time: value } }))} />
                    <TimeSelects label="Close time" value={serviceSettings[activeServiceTab].closing_time} onChange={(value) => setServiceSettings((current) => ({ ...current, [activeServiceTab]: { ...current[activeServiceTab], closing_time: value } }))} />
                    <label className="block"><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Booking / cancellation policy</span><input value={serviceSettings[activeServiceTab].policy} onChange={(e) => setServiceSettings((current) => ({ ...current, [activeServiceTab]: { ...current[activeServiceTab], policy: e.target.value } }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-400" placeholder="Free cancellation up to 24 hours" /></label>
                  </div>
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

            {activeTab === "onboarding" && (
              <div className="space-y-6">
                <div><h2 className="text-xl font-black text-slate-800 mb-1">Onboarding details</h2><p className="text-sm text-slate-400">Update the registration information used across your provider profile.</p></div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block"><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Business name</span><input value={profileForm.business_name} onChange={(e) => setProfileForm((current) => ({ ...current, business_name: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" placeholder="Business name" /></label>
                  <label className="block"><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Business category</span><input readOnly value={configuredCategories.join(", ") || "Restaurant"} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600" /></label>
                  <label className="block"><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Owner / contact name</span><input value={profileForm.owner_full_name} onChange={(e) => setProfileForm((current) => ({ ...current, owner_full_name: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" placeholder="Full name" /></label>
                  <label className="block"><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Email</span><input type="email" value={profileForm.email} onChange={(e) => setProfileForm((current) => ({ ...current, email: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" placeholder="business@example.com" /></label>
                  <label className="block"><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Phone</span><input value={profileForm.phone} onChange={(e) => setProfileForm((current) => ({ ...current, phone: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" placeholder="Phone number" /></label>
                  <label className="block"><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Business address</span><input value={profileForm.address} onChange={(e) => setProfileForm((current) => ({ ...current, address: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" placeholder="Full business address" /></label>
                  <label className="block"><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Public location label</span><input value={profileForm.location_label} onChange={(e) => setProfileForm((current) => ({ ...current, location_label: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" placeholder="Dhaka, Bangladesh" /></label>
                  <label className="block md:col-span-2"><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Business description</span><textarea rows={4} value={profileForm.description} onChange={(e) => setProfileForm((current) => ({ ...current, description: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" placeholder="Describe your business and customer experience" /></label>
                </div>
                <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">Your Business Profile, service settings, room records, and customer listings use these saved onboarding details.</div>
                <button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? "Saving..." : saved ? "Saved!" : "Save Onboarding Details"}</button>
              </div>
            )}
          </div>
        </div>
      </main>

      {locationMapOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h3 className="text-lg font-black text-slate-800">Choose {activeServiceTab} location</h3><p className="text-xs text-slate-500">Click the map or drag the pin to the exact location.</p></div><button type="button" onClick={() => setLocationMapOpen(false)} className="rounded-xl px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100">Done</button></div>
            {!GOOGLE_MAPS_API_KEY ? <div className="p-6 text-sm text-rose-600">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the map picker.</div> : <div ref={locationMapRef} className="h-[420px] w-full bg-slate-100" />}
          </div>
        </div>
      ) : null}

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

function TimeSelects({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const parts = splitServiceTime(value);
  const selectClass = "min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-sky-400";
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
        <select aria-label={`${label} hour`} value={parts.hour} onChange={(event) => onChange(setServiceTimePart(value, "hour", event.target.value))} className={selectClass}><option value="">Hour</option>{SERVICE_HOURS.map((hour) => <option key={hour} value={hour}>{hour}</option>)}</select>
        <select aria-label={`${label} minute`} value={parts.minute} onChange={(event) => onChange(setServiceTimePart(value, "minute", event.target.value))} className={selectClass}><option value="">Min</option>{SERVICE_MINUTES.map((minute) => <option key={minute} value={minute}>{minute}</option>)}</select>
        <select aria-label={`${label} period`} value={parts.period} onChange={(event) => onChange(setServiceTimePart(value, "period", event.target.value))} className={selectClass}><option value="">AM/PM</option>{SERVICE_PERIODS.map((period) => <option key={period} value={period}>{period}</option>)}</select>
      </div>
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
