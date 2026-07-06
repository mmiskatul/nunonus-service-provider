"use client";

import { Header } from "@/components/Header";
import {
  vendorCreateEvent,
  vendorDeleteEvent,
  vendorGetProfileSettings,
  vendorListEvents,
  vendorUpdateEvent,
  vendorUpdateEventStatus,
  uploadVendorFile,
  type VendorEventPayload,
  type VendorEventStatus,
} from "@/lib/vendor-api";
import { cn } from "@/lib/utils";
import { extractVendorCategories, type VendorCategory } from "@/lib/vendor-access";
import { CalendarDays, Clock3, MapPin, Pencil, Plus, Search, Trash2, Upload, Users, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const DEFAULT_TIMEZONE = "Asia/Dhaka";
const TIMEZONE_OPTIONS = [
  "Asia/Dhaka",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Bangkok",
  "Asia/Kuala_Lumpur",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
];

type TimezoneOption = {
  value: string;
  label: string;
};

type LocationOption = {
  value: string;
  label: string;
};

type VendorEventRecord = {
  id: string;
  title: string;
  category: string;
  event_type: string;
  event_date: string;
  start_time: string;
  end_time: string;
  timezone?: string;
  venue: string;
  capacity: number;
  ticket_price: number;
  registration_deadline?: string | null;
  description: string;
  banner_image_url?: string | null;
  active?: boolean;
  status: VendorEventStatus;
};

type FormState = {
  title: string;
  category: VendorCategory;
  eventType: string;
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

const DEFAULT_CATEGORIES: VendorCategory[] = ["Restaurant"];

function getDefaultForm(categories: VendorCategory[]): FormState {
  return {
    title: "",
    category: categories[0] ?? "Restaurant",
    eventType: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    timezone: DEFAULT_TIMEZONE,
    venue: "",
    capacity: "",
    ticketPrice: "",
    registrationDeadline: "",
    description: "",
    bannerImageUrl: "",
    status: "draft",
  };
}

function normalizeEvent(row: Record<string, unknown>): VendorEventRecord {
  return {
    id: String(row.id ?? row._id ?? ""),
    title: String(row.title ?? ""),
    category: String(row.category ?? ""),
    event_type: String(row.event_type ?? ""),
    event_date: String(row.event_date ?? ""),
    start_time: String(row.start_time ?? ""),
    end_time: String(row.end_time ?? ""),
    timezone: String(row.timezone ?? DEFAULT_TIMEZONE),
    venue: String(row.venue ?? ""),
    capacity: Number(row.capacity ?? 0),
    ticket_price: Number(row.ticket_price ?? 0),
    registration_deadline:
      row.registration_deadline == null ? null : String(row.registration_deadline),
    description: String(row.description ?? ""),
    banner_image_url: row.banner_image_url == null ? null : String(row.banner_image_url),
    active: Boolean(row.active ?? row.active_status ?? true),
    status: String(row.status ?? "draft").toLowerCase() as VendorEventStatus,
  };
}

function toPayload(form: FormState): VendorEventPayload {
  return {
    title: form.title.trim(),
    category: form.category,
    event_type: form.eventType.trim(),
    event_date: form.eventDate,
    start_time: form.startTime,
    end_time: form.endTime,
    timezone: form.timezone.trim() || DEFAULT_TIMEZONE,
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

function validateForm(form: FormState): string | null {
  if (!form.title.trim()) return "Event title is required.";
  if (!form.eventType.trim()) return "Event type is required.";
  if (!form.eventDate) return "Event date is required.";
  if (!form.startTime) return "Start time is required.";
  if (!form.endTime) return "End time is required.";
  if (form.endTime <= form.startTime) return "End time must be later than start time.";
  if (!form.venue.trim()) return "Location is required.";
  if (!form.capacity.trim() || Number(form.capacity) <= 0) return "Capacity must be greater than zero.";
  if (!form.ticketPrice.trim() || Number(form.ticketPrice) < 0) return "Ticket price must be zero or more.";
  if (form.registrationDeadline && !form.registrationDeadline.includes("T")) {
    return "Registration deadline must include both date and time.";
  }
  if (!form.description.trim()) return "Description is required.";
  return null;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function detectBrowserTimezone() {
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return resolved && resolved.trim() ? resolved : DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

function buildTimezoneOptions(currentValue: string) {
  const supportedValuesOf = (
    Intl as typeof Intl & {
      supportedValuesOf?: (key: "timeZone") => string[];
    }
  ).supportedValuesOf;
  const values = new Set([
    ...TIMEZONE_OPTIONS,
    ...(typeof supportedValuesOf === "function" ? supportedValuesOf("timeZone") : []),
  ]);
  if (currentValue.trim()) {
    values.add(currentValue.trim());
  }
  return Array.from(values).sort((left, right) => left.localeCompare(right));
}

function formatTimezoneOffset(timezone: string) {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
      hour: "2-digit",
      minute: "2-digit",
    });
    const zonePart = formatter
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value;

    if (!zonePart) {
      return "UTC";
    }

    return zonePart.replace("GMT", "UTC");
  } catch {
    return "UTC";
  }
}

function buildTimezoneSelectOptions(currentValue: string, detectedTimezone: string): TimezoneOption[] {
  return buildTimezoneOptions(currentValue).map((timezone) => ({
    value: timezone,
    label:
      timezone === detectedTimezone
        ? `${formatTimezoneOffset(timezone)} · ${timezone} · Your timezone`
        : `${formatTimezoneOffset(timezone)} · ${timezone}`,
  }));
}

function deriveSavedRestaurantLocation(profile: Record<string, unknown>) {
  const candidates = [
    profile.location_value,
    profile.office_address,
    profile.business_address,
    profile.address,
  ];

  for (const value of candidates) {
    const normalized = String(value ?? "").trim();
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function buildSavedLocationLabel(category: string) {
  const normalizedCategory = category.trim().toLowerCase();
  if (!normalizedCategory) {
    return "Your location";
  }
  return `Your ${normalizedCategory} location`;
}

export function EventsPageClient({ startInCreateMode = false }: { startInCreateMode?: boolean }) {
  const detectedTimezone = useMemo(() => detectBrowserTimezone(), []);
  const [categories, setCategories] = useState<VendorCategory[]>(DEFAULT_CATEGORIES);
  const [events, setEvents] = useState<VendorEventRecord[]>([]);
  const [form, setForm] = useState<FormState>(() => ({
    ...getDefaultForm(DEFAULT_CATEGORIES),
    timezone: detectedTimezone,
  }));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(startInCreateMode);
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showMapModal, setShowMapModal] = useState(false);
  const [showBannerPreview, setShowBannerPreview] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [savedRestaurantLocation, setSavedRestaurantLocation] = useState("");
  const [currentLocationLabel, setCurrentLocationLabel] = useState("Current location");
  const [tempCoords, setTempCoords] = useState({ lat: 23.8103, lng: 90.4125 });
  const [tempAddress, setTempAddress] = useState("");
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const mapInitializedRef = useRef(false);
  const timezoneOptions = useMemo(
    () => buildTimezoneSelectOptions(form.timezone, detectedTimezone),
    [detectedTimezone, form.timezone],
  );
  const locationOptions = useMemo(() => {
    const options: LocationOption[] = [];
    if (savedRestaurantLocation) {
      options.push({
        value: savedRestaurantLocation,
        label: buildSavedLocationLabel(form.category),
      });
    }
    if (currentLocationLabel.trim()) {
      const normalizedCurrentLocation = currentLocationLabel.replace(/^Custom location:\s*/, "").trim();
      options.push({
        value: normalizedCurrentLocation,
        label: currentLocationLabel.startsWith("Custom location:") ? "Custom location" : "Current location",
      });
    }
    return options;
  }, [currentLocationLabel, form.category, savedRestaurantLocation]);

  const loadEvents = async (filters?: { search?: string; status?: string }) => {
    const response = await vendorListEvents({
      search: filters?.search,
      status: filters?.status && filters.status !== "all" ? filters.status : undefined,
    });
    const nextItems = Array.isArray(response.items)
      ? response.items.map((item) => normalizeEvent(item as Record<string, unknown>))
      : [];
    setEvents(nextItems);
  };

  const refreshProfileLocation = async () => {
    const profile = await vendorGetProfileSettings();
    const nextCategories = extractVendorCategories(profile.categories ?? profile.category);
    const nextSavedLocation = deriveSavedRestaurantLocation(profile);
    setCategories(nextCategories);
    setSavedRestaurantLocation(nextSavedLocation);
    setForm((current) => ({
      ...current,
      category: nextCategories.includes(current.category) ? current.category : nextCategories[0],
      timezone: current.timezone || detectedTimezone,
      venue: current.venue || nextSavedLocation,
    }));
    return { nextCategories, nextSavedLocation };
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const profile = await vendorGetProfileSettings();
        if (!active) return;
        const nextCategories = extractVendorCategories(profile.categories ?? profile.category);
        const nextSavedLocation = deriveSavedRestaurantLocation(profile);
        setCategories(nextCategories);
        setSavedRestaurantLocation(nextSavedLocation);
        setForm((current) => ({
          ...current,
          category: nextCategories.includes(current.category) ? current.category : nextCategories[0],
          timezone: current.timezone || detectedTimezone,
          venue: current.venue || nextSavedLocation,
        }));
        await loadEvents();
      } catch (error) {
        if (!active) return;
        setStatusMessage(error instanceof Error ? error.message : "Failed to load events.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [detectedTimezone]);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setTempCoords(nextCoords);
        setCurrentLocationLabel(
          `Current location (${nextCoords.lat.toFixed(4)}, ${nextCoords.lng.toFixed(4)})`,
        );
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  useEffect(() => {
    if (!showMapModal) {
      mapInitializedRef.current = false;
      return;
    }

    if (!GOOGLE_MAPS_API_KEY || mapInitializedRef.current) {
      return;
    }

    mapInitializedRef.current = true;

    const initialCoords = tempCoords;
    const initialAddress = tempAddress.trim();
    const venueAddress = form.venue.trim();

    const initMap = () => {
      const google = (window as Window & { google?: any }).google;
      if (!google) return;

      const mapDiv = document.getElementById("event-google-map-element");
      if (!mapDiv) return;

      const map = new google.maps.Map(mapDiv, {
        center: initialCoords,
        zoom: 14,
        disableDefaultUI: false,
        zoomControl: true,
      });

      const marker = new google.maps.Marker({
        position: initialCoords,
        map,
        draggable: true,
      });

      const updateLocation = (lat: number, lng: number, locationRef: any) => {
        setTempCoords({ lat, lng });
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: locationRef }, (results: any, status: any) => {
          if (status === "OK" && results?.[0]) {
            setTempAddress(results[0].formatted_address);
          } else {
            setTempAddress(`Coordinate (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          }
        });
      };

      const tryGeolocation = () => {
        if (!navigator.geolocation) {
          updateLocation(initialCoords.lat, initialCoords.lng, initialCoords);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            map.setCenter(pos);
            marker.setPosition(pos);
            updateLocation(pos.lat, pos.lng, pos);
          },
          () => {
            updateLocation(initialCoords.lat, initialCoords.lng, initialCoords);
          },
        );
      };

      if (venueAddress.length > 3) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: venueAddress }, (results: any, status: any) => {
          if (status === "OK" && results?.[0]) {
            const loc = results[0].geometry.location;
            const next = { lat: loc.lat(), lng: loc.lng() };
            map.setCenter(next);
            marker.setPosition(next);
            setTempCoords(next);
            setTempAddress(results[0].formatted_address);
          } else {
            updateLocation(initialCoords.lat, initialCoords.lng, initialCoords);
          }
        });
      } else if (initialAddress.length > 3) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: initialAddress }, (results: any, status: any) => {
          if (status === "OK" && results?.[0]) {
            const loc = results[0].geometry.location;
            const next = { lat: loc.lat(), lng: loc.lng() };
            map.setCenter(next);
            marker.setPosition(next);
            setTempCoords(next);
            setTempAddress(results[0].formatted_address);
          } else {
            updateLocation(initialCoords.lat, initialCoords.lng, initialCoords);
          }
        });
      } else {
        tryGeolocation();
      }

      map.addListener("click", (event: any) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        marker.setPosition(event.latLng);
        updateLocation(lat, lng, event.latLng);
      });

      marker.addListener("dragend", () => {
        const position = marker.getPosition();
        if (!position) return;
        updateLocation(position.lat(), position.lng(), position);
      });
    };

    if ((window as Window & { google?: any }).google) {
      initMap();
      return;
    }

    const scriptId = "google-maps-js-api-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const handleScriptLoad = () => {
      initMap();
    };

    script.addEventListener("load", handleScriptLoad);
    return () => {
      script?.removeEventListener("load", handleScriptLoad);
    };
  }, [form.venue, showMapModal, tempAddress]);

  const stats = useMemo(() => {
    return {
      total: events.length,
      published: events.filter((item) => item.status === "published").length,
      draft: events.filter((item) => item.status === "draft").length,
      cancelled: events.filter((item) => item.status === "cancelled").length,
    };
  }, [events]);

  const resetForm = () => {
    setForm({
      ...getDefaultForm(categories),
      timezone: detectedTimezone,
      venue: savedRestaurantLocation,
    });
    setEditingId(null);
    setShowForm(false);
    setShowMapModal(false);
    setShowBannerPreview(false);
    setShowSaveConfirm(false);
    setTempAddress("");
  };

  const openCreateForm = async () => {
    let nextSavedLocation = savedRestaurantLocation;
    let nextCategories = categories;
    try {
      const refreshed = await refreshProfileLocation();
      nextSavedLocation = refreshed.nextSavedLocation;
      nextCategories = refreshed.nextCategories;
    } catch {
      // Keep the form usable even if the profile refresh fails.
    }
    setForm({
      ...getDefaultForm(nextCategories),
      timezone: detectedTimezone,
      venue: nextSavedLocation,
    });
    setEditingId(null);
    setShowForm(true);
    setTempAddress("");
  };

  const openMapPicker = () => {
    if (!GOOGLE_MAPS_API_KEY) {
      setStatusMessage("Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to the service-provider app.");
      return;
    }
    setTempAddress(form.venue.trim());
    setShowMapModal(true);
  };

  const handleConfirmMapLocation = () => {
    const nextAddress = tempAddress.trim();
    setForm((prev) => ({ ...prev, venue: nextAddress || prev.venue }));
    if (nextAddress && nextAddress !== savedRestaurantLocation) {
      setCurrentLocationLabel(`Custom location: ${nextAddress}`);
    }
    setShowMapModal(false);
  };

  const handleSelectLocationOption = (option: LocationOption) => {
    setForm((prev) => ({ ...prev, venue: option.value }));
    setTempAddress(option.value);
  };

  const handleBannerUpload = async (file: File | null) => {
    if (!file) {
      return;
    }

    try {
      setStatusMessage("Uploading banner image...");
      const url = await uploadVendorFile(file);
      setForm((prev) => ({ ...prev, bannerImageUrl: url }));
      setStatusMessage("Banner image uploaded.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to upload banner image.",
      );
    }
  };

  const handleOpenSaveConfirm = () => {
    const validationError = validateForm(form);
    if (validationError) {
      setStatusMessage(validationError);
      return;
    }

    setStatusMessage("");
    setShowSaveConfirm(true);
  };

  const handleSubmit = async () => {
    const validationError = validateForm(form);
    if (validationError) {
      setStatusMessage(validationError);
      setShowSaveConfirm(false);
      return;
    }

    setSaving(true);
    setStatusMessage("");
    try {
      const payload = toPayload(form);
      if (editingId) {
        await vendorUpdateEvent(editingId, payload);
        setStatusMessage("Event updated.");
      } else {
        await vendorCreateEvent(payload);
        setStatusMessage("Event created.");
      }
      await loadEvents({ search, status: statusFilter });
      resetForm();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to save event.");
    } finally {
      setShowSaveConfirm(false);
      setSaving(false);
    }
  };

  const handleEdit = (event: VendorEventRecord) => {
    setEditingId(event.id);
    setShowForm(true);
    setStatusMessage("");
    setForm({
      title: event.title,
      category: categories.includes(event.category as VendorCategory)
        ? (event.category as VendorCategory)
        : categories[0],
      eventType: event.event_type,
      eventDate: event.event_date,
      startTime: event.start_time,
      endTime: event.end_time,
      timezone: event.timezone || detectedTimezone,
      venue: event.venue,
      capacity: String(event.capacity),
      ticketPrice: String(event.ticket_price),
      registrationDeadline: event.registration_deadline ?? "",
      description: event.description,
      bannerImageUrl: event.banner_image_url ?? "",
      status: event.status,
    });
    setTempAddress(event.venue);
  };

  const handleDelete = async (eventId: string) => {
    try {
      await vendorDeleteEvent(eventId);
      await loadEvents({ search, status: statusFilter });
      if (editingId === eventId) {
        resetForm();
      }
      setStatusMessage("Event deleted.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to delete event.");
    }
  };

  const handleStatusChange = async (eventId: string, nextStatus: VendorEventStatus) => {
    try {
      await vendorUpdateEventStatus(eventId, nextStatus);
      await loadEvents({ search, status: statusFilter });
      setStatusMessage(`Event marked as ${nextStatus}.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to update event status.");
    }
  };

  const applyFilters = async () => {
    try {
      await loadEvents({ search, status: statusFilter });
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to filter events.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Header title="Event Management" />

      <main className="flex-1 p-6 md:p-10 pb-24">
        <div className="mx-auto max-w-[1400px] space-y-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Event Venue Management</h1>
              <p className="mt-1 text-sm text-slate-400">
                Create, edit, publish, archive, and delete vendor events with fixed dates and times.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1e2a5e] px-5 py-3 text-sm font-bold text-white shadow-xl shadow-slate-900/10 transition hover:bg-[#1a2552]"
              >
                <Plus className="h-4 w-4" />
                Create Event
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Events" value={String(stats.total)} />
            <StatCard label="Published" value={String(stats.published)} />
            <StatCard label="Draft" value={String(stats.draft)} />
            <StatCard label="Cancelled" value={String(stats.cancelled)} />
          </div>

          {statusMessage ? (
            <p className="text-sm font-bold text-[#1e2a5e]">{statusMessage}</p>
          ) : null}

          <section className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Event List</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Allowed categories for this vendor: {categories.join(", ")}.
                  </p>
                </div>

                <div className="grid gap-3 xl:w-[560px] xl:grid-cols-[minmax(0,1fr)_180px_auto]">
                  <label className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search events, venues, or event types"
                      className="h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-4 text-sm outline-none transition focus:border-sky-500"
                    />
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="h-12 rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                  >
                    <option value="all">All statuses</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    onClick={() => void applyFilters()}
                    className="rounded-2xl bg-[#1e2a5e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1a2552]"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="py-16 text-center text-sm font-medium text-slate-400">Loading events...</div>
              ) : events.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
                  <p className="text-lg font-bold text-slate-700">No events created yet.</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Start by creating a time-based event with a fixed schedule and registration deadline.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <article key={event.id} className="rounded-[24px] border border-slate-100 bg-slate-50/70 p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/events/${event.id}`}
                              className="text-lg font-bold text-slate-800 transition hover:text-[#1e2a5e]"
                            >
                              {event.title}
                            </Link>
                            <span className={statusClass(event.status)}>{event.status}</span>
                            <span className="rounded-full bg-[#e8f0ff] px-3 py-1 text-xs font-bold text-[#1e2a5e]">
                              {event.category}
                            </span>
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                              {event.event_type}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500">{event.description}</p>
                          <div className="grid gap-3 text-sm text-slate-500 md:grid-cols-2 xl:grid-cols-4">
                            <Meta icon={CalendarDays} label={event.event_date} />
                            <Meta icon={Clock3} label={`${event.start_time} - ${event.end_time}`} />
                            <Meta icon={MapPin} label={event.venue} />
                            <Meta icon={Users} label={`${event.capacity} seats · ${formatMoney(event.ticket_price)}`} />
                          </div>
                          {event.registration_deadline ? (
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                              Registration closes: {event.registration_deadline}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/events/${event.id}`}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                          >
                            View Details
                          </Link>
                          <button
                            onClick={() =>
                              void handleStatusChange(
                                event.id,
                                event.status === "published" ? "draft" : "published",
                              )
                            }
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                          >
                            {event.status === "published" ? "Move to Draft" : "Publish"}
                          </button>
                          <button
                            onClick={() => void handleStatusChange(event.id, "archived")}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                          >
                            Archive
                          </button>
                          <button
                            onClick={() => handleEdit(event)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => void handleDelete(event.id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-100"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
        </div>
      </main>

      {showForm ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 p-3 backdrop-blur-sm md:p-6">
          <div className="mx-auto flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 md:px-6">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {editingId ? "Edit Event" : "Create Event"}
                </p>
                <h2 className="mt-1.5 text-2xl font-black text-slate-800 md:text-[28px]">
                  {editingId ? "Edit Event" : "New Event"}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Fill the event details here. This is the same flow for both new and create event.
                </p>
              </div>
              <button
                onClick={resetForm}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                aria-label="Close event form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6 md:py-5">
              <div className="space-y-4">
                  <Field label="Event Title">
                    <input
                      value={form.title}
                      onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                      className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                      placeholder="Founder networking night"
                    />
                  </Field>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Field label="Category">
                      <select
                        value={form.category}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, category: event.target.value as VendorCategory }))
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
                        value={form.eventType}
                        onChange={(event) => setForm((prev) => ({ ...prev, eventType: event.target.value }))}
                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                        placeholder="Corporate Gala"
                      />
                    </Field>
                    <Field label="Status">
                      <select
                        value={form.status}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, status: event.target.value as VendorEventStatus }))
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
                  <div className="grid gap-4 xl:grid-cols-3">
                  <Field label="Timezone">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <select
                        value={form.timezone}
                        onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))}
                        className="h-7 w-full border-0 bg-transparent p-0 text-sm font-bold outline-none"
                      >
                        {timezoneOptions.map((timezone) => (
                          <option key={timezone.value} value={timezone.value}>
                            {timezone.label.replace(" ? Your timezone", "")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </Field>
                    <div className="xl:col-span-2">
                      <Field label="Location">
                        <div className="space-y-2">
                          <div className="flex flex-col gap-3 md:flex-row">
                            <div className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 transition focus-within:border-sky-500">
                              <select
                                value={form.venue}
                                onChange={(event) => {
                                  const nextValue = event.target.value;
                                  const matchedOption = locationOptions.find((option) => option.value === nextValue);
                                  if (matchedOption) {
                                    handleSelectLocationOption(matchedOption);
                                    return;
                                  }
                                  setForm((prev) => ({ ...prev, venue: nextValue }));
                                  setTempAddress(nextValue);
                                }}
                                className="h-7 w-full border-0 bg-transparent p-0 text-sm font-bold outline-none"
                              >
                                <option value="">Select location option</option>
                                {locationOptions
                                  .filter((option) => option.value.trim())
                                  .map((option) => (
                                    <option key={`${option.label}-${option.value}`} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                              </select>
                            </div>
                            <button
                              type="button"
                              onClick={openMapPicker}
                              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                            >
                              <MapPin className="h-4 w-4" />
                              Select on Map
                            </button>
                          </div>
                          <p className="text-xs font-medium text-slate-400">
                            Use the live map to pick the real event location.
                          </p>
                        </div>
                      </Field>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Field label="Event Date">
                      <input
                        type="date"
                        value={form.eventDate}
                        onChange={(event) => setForm((prev) => ({ ...prev, eventDate: event.target.value }))}
                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                      />
                    </Field>
                    <Field label="Registration Deadline">
                      <input
                        type="datetime-local"
                        value={form.registrationDeadline}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, registrationDeadline: event.target.value }))
                        }
                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                      />
                    </Field>
                    <Field label="Ticket Price">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={form.ticketPrice}
                        onChange={(event) => setForm((prev) => ({ ...prev, ticketPrice: event.target.value }))}
                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                        placeholder="45"
                      />
                    </Field>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Field label="Start Time">
                      <input
                        type="time"
                        value={form.startTime}
                        onChange={(event) => setForm((prev) => ({ ...prev, startTime: event.target.value }))}
                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                      />
                    </Field>
                    <Field label="End Time">
                      <input
                        type="time"
                        value={form.endTime}
                        onChange={(event) => setForm((prev) => ({ ...prev, endTime: event.target.value }))}
                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                      />
                    </Field>
                    <Field label="Capacity">
                      <input
                        type="number"
                        min="1"
                        value={form.capacity}
                        onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))}
                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                        placeholder="300"
                      />
                    </Field>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-3">
                  <Field label="Banner Image">
                    <div className="space-y-2">
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
                      {form.bannerImageUrl ? null : (
                        <button
                          type="button"
                          onClick={() => bannerInputRef.current?.click()}
                          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                          aria-label="Upload banner"
                        >
                          <Plus className="h-4 w-4" />
                          Upload Banner
                        </button>
                      )}
                      {form.bannerImageUrl ? (
                        <div
                          className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50"
                          role="button"
                          tabIndex={0}
                          onClick={() => setShowBannerPreview(true)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setShowBannerPreview(true);
                            }
                          }}
                        >
                          <img
                            src={form.bannerImageUrl}
                            alt="Banner preview"
                            className="h-32 w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-950/45 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100" />
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setForm((prev) => ({ ...prev, bannerImageUrl: "" }));
                              setShowBannerPreview(false);
                            }}
                            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-sm opacity-0 transition hover:bg-white group-hover:opacity-100 group-focus-within:opacity-100"
                            aria-label="Remove banner image"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              bannerInputRef.current?.click();
                            }}
                            className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-sm opacity-0 transition hover:bg-white group-hover:opacity-100 group-focus-within:opacity-100"
                            aria-label="Replace banner image"
                          >
                            <Upload className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs font-medium text-slate-400">
                          Upload a JPG or PNG banner image.
                        </p>
                      )}
                    </div>
                  </Field>
                    <div className="xl:col-span-2">
                      <Field label="Description">
                        <textarea
                          value={form.description}
                          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                          className="min-h-[112px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                          placeholder="Describe the event agenda, audience, and timing."
                        />
                      </Field>
                    </div>
                  </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-4 md:px-6">
              <button
                onClick={resetForm}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleOpenSaveConfirm}
                disabled={saving}
                className="rounded-xl bg-[#1e2a5e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1a2552] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : editingId ? "Update Event" : "Save Event"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showMapModal ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Event Location
                </p>
                <h3 className="mt-2 text-2xl font-black text-slate-800">Select event location</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Click on the map or drag the marker to use the real event address.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                aria-label="Close map modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                <div id="event-google-map-element" className="h-[420px] w-full" />
              </div>
              <div className="rounded-[20px] border border-slate-100 bg-slate-50 px-5 py-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Selected Address</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {tempAddress || "Select a point on the map to capture the event location."}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  {tempCoords.lat.toFixed(5)}, {tempCoords.lng.toFixed(5)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMapLocation}
                className="rounded-xl bg-[#1e2a5e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1a2552]"
              >
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showSaveConfirm ? (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-5 py-4 md:px-6">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                Confirm Event
              </p>
              <h3 className="mt-1.5 text-xl font-black text-slate-800">
                {editingId ? "Update this event?" : "Create this event?"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {editingId
                  ? "The event endpoint will run only after you confirm this update."
                  : "The event create endpoint will run only after you confirm this new event."}
              </p>
            </div>
            <div className="px-5 py-4 md:px-6">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-sm font-extrabold text-slate-800">{form.title || "Untitled event"}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {form.eventDate} {form.startTime ? `• ${form.startTime}` : ""} {form.venue ? `• ${form.venue}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-4 md:px-6">
              <button
                type="button"
                onClick={() => setShowSaveConfirm(false)}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={saving}
                className="rounded-xl bg-[#1e2a5e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1a2552] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showBannerPreview && form.bannerImageUrl ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 md:px-6">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Banner Preview</p>
                <p className="mt-1 text-sm text-slate-500">Full banner image inside the popup.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBannerPreview(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                aria-label="Close banner preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-slate-50 p-4 md:p-6">
              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                <img
                  src={form.bannerImageUrl}
                  alt="Banner full preview"
                  className="max-h-[72vh] w-full object-contain bg-slate-50"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function statusClass(status: VendorEventStatus) {
  return cn(
    "rounded-full px-3 py-1 text-xs font-bold capitalize",
    status === "published"
      ? "bg-emerald-100 text-emerald-700"
      : status === "archived"
        ? "bg-slate-200 text-slate-600"
        : status === "cancelled"
          ? "bg-rose-100 text-rose-700"
          : "bg-amber-100 text-amber-700",
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-4 text-3xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-slate-700">{label}</span>
      {children}
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
}: {
  icon: typeof CalendarDays;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-slate-400" />
      <span>{label}</span>
    </div>
  );
}
