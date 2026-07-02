"use client";

import { Header } from "@/components/Header";
import { vendorGetEvent, type VendorEventStatus } from "@/lib/vendor-api";
import { cn } from "@/lib/utils";
import { CalendarDays, Clock3, MapPin, Tag, Ticket, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  status: VendorEventStatus;
};

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
    status: String(row.status ?? "draft").toLowerCase() as VendorEventStatus,
  };
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
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

export function EventDetailClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<VendorEventRecord | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await vendorGetEvent(eventId);
        if (!active) return;
        setEvent(normalizeEvent(response));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load event.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [eventId]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Header title="Event Details" />
      <main className="flex-1 p-6 md:p-10 pb-24">
        <div className="mx-auto max-w-[1200px] space-y-8">
          <div className="flex items-center justify-between">
            <Link
              href="/events"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Back to Events
            </Link>
          </div>

          {loading ? (
            <div className="rounded-[32px] border border-slate-100 bg-white p-10 text-center text-sm font-medium text-slate-400 shadow-sm">
              Loading event details...
            </div>
          ) : error ? (
            <div className="rounded-[32px] border border-rose-100 bg-white p-10 text-center text-sm font-bold text-rose-600 shadow-sm">
              {error}
            </div>
          ) : event ? (
            <>
              <section className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={statusClass(event.status)}>{event.status}</span>
                      <span className="rounded-full bg-[#e8f0ff] px-3 py-1 text-xs font-bold text-[#1e2a5e]">
                        {event.category}
                      </span>
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                        {event.event_type}
                      </span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">
                      {event.title}
                    </h1>
                    <p className="max-w-3xl text-sm text-slate-500">{event.description}</p>
                  </div>

                  <Link
                    href="/events"
                    className="rounded-xl bg-[#1e2a5e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1a2552]"
                  >
                    Manage Events
                  </Link>
                </div>
              </section>

              <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <DetailCard icon={CalendarDays} label="Event Date" value={event.event_date} />
                <DetailCard icon={Clock3} label="Time" value={`${event.start_time} - ${event.end_time}`} />
                <DetailCard icon={MapPin} label="Venue" value={event.venue} />
                <DetailCard icon={Users} label="Capacity" value={`${event.capacity} seats`} />
                <DetailCard icon={Ticket} label="Ticket Price" value={formatMoney(event.ticket_price)} />
                <DetailCard icon={Tag} label="Timezone" value={event.timezone || "Asia/Dhaka"} />
              </section>

              <section className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800">Registration</h2>
                <p className="mt-3 text-sm text-slate-500">
                  Deadline: {event.registration_deadline || "Not set"}
                </p>
                {event.banner_image_url ? (
                  <p className="mt-3 text-sm text-slate-500 break-all">
                    Banner: {event.banner_image_url}
                  </p>
                ) : null}
              </section>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function DetailCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-2 text-base font-bold text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  );
}
