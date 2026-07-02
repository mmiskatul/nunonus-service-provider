"use client";

import { Header } from "@/components/Header";
import {
  vendorCreateEvent,
  vendorDeleteEvent,
  vendorGetProfileSettings,
  vendorListEvents,
  vendorUpdateEvent,
  vendorUpdateEventStatus,
  type VendorEventPayload,
  type VendorEventStatus,
} from "@/lib/vendor-api";
import { cn } from "@/lib/utils";
import { extractVendorCategories, type VendorCategory } from "@/lib/vendor-access";
import { CalendarDays, Clock3, MapPin, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

function normalizeEvent(row: Record<string, unknown>): VendorEventRecord {
  return {
    id: String(row.id ?? row._id ?? ""),
    title: String(row.title ?? ""),
    category: String(row.category ?? ""),
    event_type: String(row.event_type ?? ""),
    event_date: String(row.event_date ?? ""),
    start_time: String(row.start_time ?? ""),
    end_time: String(row.end_time ?? ""),
    timezone: String(row.timezone ?? "Asia/Dhaka"),
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

function validateForm(form: FormState): string | null {
  if (!form.title.trim()) return "Event title is required.";
  if (!form.eventType.trim()) return "Event type is required.";
  if (!form.eventDate) return "Event date is required.";
  if (!form.startTime) return "Start time is required.";
  if (!form.endTime) return "End time is required.";
  if (form.endTime <= form.startTime) return "End time must be later than start time.";
  if (!form.venue.trim()) return "Venue is required.";
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

export function EventsPageClient({ startInCreateMode = false }: { startInCreateMode?: boolean }) {
  const [categories, setCategories] = useState<VendorCategory[]>(DEFAULT_CATEGORIES);
  const [events, setEvents] = useState<VendorEventRecord[]>([]);
  const [form, setForm] = useState<FormState>(getDefaultForm(DEFAULT_CATEGORIES));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(startInCreateMode);
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const profile = await vendorGetProfileSettings();
        if (!active) return;
        const nextCategories = extractVendorCategories(profile.categories ?? profile.category);
        setCategories(nextCategories);
        setForm((current) => ({
          ...current,
          category: nextCategories.includes(current.category) ? current.category : nextCategories[0],
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
  }, []);

  const stats = useMemo(() => {
    return {
      total: events.length,
      published: events.filter((item) => item.status === "published").length,
      draft: events.filter((item) => item.status === "draft").length,
      cancelled: events.filter((item) => item.status === "cancelled").length,
    };
  }, [events]);

  const resetForm = () => {
    setForm(getDefaultForm(categories));
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    const validationError = validateForm(form);
    if (validationError) {
      setStatusMessage(validationError);
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
      timezone: event.timezone || "Asia/Dhaka",
      venue: event.venue,
      capacity: String(event.capacity),
      ticketPrice: String(event.ticket_price),
      registrationDeadline: event.registration_deadline ?? "",
      description: event.description,
      bannerImageUrl: event.banner_image_url ?? "",
      status: event.status,
    });
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
              <Link
                href="/events/new"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1e2a5e] px-5 py-3 text-sm font-bold text-white shadow-xl shadow-slate-900/10 transition hover:bg-[#1a2552]"
              >
                <Plus className="h-4 w-4" />
                Create Event
              </Link>
              {showForm ? (
                <button
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Close Form
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Events" value={String(stats.total)} />
            <StatCard label="Published" value={String(stats.published)} />
            <StatCard label="Draft" value={String(stats.draft)} />
            <StatCard label="Cancelled" value={String(stats.cancelled)} />
          </div>

          <div className="grid gap-4 rounded-[28px] border border-slate-100 bg-white p-5 md:grid-cols-[1fr,220px,auto] md:p-6">
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

          {statusMessage ? (
            <p className="text-sm font-bold text-[#1e2a5e]">{statusMessage}</p>
          ) : null}

          <div className="grid gap-8 xl:grid-cols-[1.2fr,0.8fr]">
            <section className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800">Event List</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Allowed categories for this vendor: {categories.join(", ")}.
                </p>
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
                            <h3 className="text-lg font-bold text-slate-800">{event.title}</h3>
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

            <section className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800">
                  {editingId ? "Edit Event" : "Create Event"}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Category access is enforced by both the dashboard and the backend API.
                </p>
              </div>

              {showForm ? (
                <div className="space-y-5">
                  <Field label="Event Title">
                    <input
                      value={form.title}
                      onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                      className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                      placeholder="Founder networking night"
                    />
                  </Field>

                  <div className="grid gap-5 md:grid-cols-2">
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
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Event Date">
                      <input
                        type="date"
                        value={form.eventDate}
                        onChange={(event) => setForm((prev) => ({ ...prev, eventDate: event.target.value }))}
                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                      />
                    </Field>
                    <Field label="Timezone">
                      <input
                        value={form.timezone}
                        onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))}
                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                        placeholder="Asia/Dhaka"
                      />
                    </Field>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
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
                  </div>

                  <Field label="Venue">
                    <input
                      value={form.venue}
                      onChange={(event) => setForm((prev) => ({ ...prev, venue: event.target.value }))}
                      className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                      placeholder="Rooftop Hall"
                    />
                  </Field>

                  <div className="grid gap-5 md:grid-cols-2">
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

                  <Field label="Banner Image URL">
                    <input
                      value={form.bannerImageUrl}
                      onChange={(event) => setForm((prev) => ({ ...prev, bannerImageUrl: event.target.value }))}
                      className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                      placeholder="https://..."
                    />
                  </Field>

                  <Field label="Description">
                    <textarea
                      value={form.description}
                      onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                      className="min-h-[140px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                      placeholder="Describe the event agenda, audience, and timing."
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

                  <div className="flex gap-3">
                    <button
                      onClick={() => void handleSubmit()}
                      disabled={saving}
                      className="rounded-xl bg-[#1e2a5e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1a2552] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? "Saving..." : editingId ? "Update Event" : "Save Event"}
                    </button>
                    <button
                      onClick={resetForm}
                      className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
                  <p className="text-base font-bold text-slate-700">Open the form to create a new event.</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1e2a5e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1a2552]"
                  >
                    <Plus className="h-4 w-4" />
                    New Event
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
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
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      {children}
    </label>
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
