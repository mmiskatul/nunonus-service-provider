"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Eye, RefreshCw, Search, X } from "lucide-react";
import { Header } from "@/components/Header";
import { useToast } from "@/components/ui/ToastProvider";
import {
  vendorGetBooking,
  vendorListBookings,
  vendorListEvents,
  vendorUpdateBookingStatus,
} from "@/lib/vendor-api";
import { cn } from "@/lib/utils";

type EventOption = { id: string; title: string; event_date?: string; status?: string };
type EventBooking = Record<string, unknown>;

function value(row: EventBooking, ...keys: string[]): string {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") return String(row[key]);
  }
  return "—";
}

function statusClass(status: string) {
  const normalized = status.toLowerCase();
  if (["complete", "completed"].includes(normalized)) return "bg-sky-50 text-sky-600";
  if (["cancelled", "canceled"].includes(normalized)) return "bg-rose-50 text-rose-600";
  if (normalized === "confirmed") return "bg-emerald-50 text-emerald-600";
  return "bg-amber-50 text-amber-600";
}

export default function EventBookingsPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<EventOption[]>([]);
  const [eventId, setEventId] = useState("");
  const [bookings, setBookings] = useState<EventBooking[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<EventBooking | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState("");

  const loadEvents = async () => {
    setEventsLoading(true);
    try {
      const response = await vendorListEvents();
      const items = Array.isArray(response.items) ? response.items : [];
      setEvents(items.map((row) => ({
        id: String(row.id ?? row._id ?? ""),
        title: String(row.title ?? "Untitled event"),
        event_date: row.event_date == null ? undefined : String(row.event_date),
        status: row.status == null ? undefined : String(row.status),
      })).filter((row) => row.id));
    } catch (error) {
      toast(error instanceof Error ? error.message : "Events could not be loaded.", "error");
    } finally {
      setEventsLoading(false);
    }
  };

  const loadBookings = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);
    try {
      const response = await vendorListBookings({
        limit: 100,
        skip: 0,
        provider_type: "event",
        event_id: eventId || undefined,
        status: status === "all" ? undefined : status,
        search: search.trim() || undefined,
      });
      const items = Array.isArray(response.items) ? response.items : Array.isArray(response.bookings) ? response.bookings : [];
      setBookings(items as EventBooking[]);
      setTotal(Number(response.total ?? items.length));
    } catch (error) {
      toast(error instanceof Error ? error.message : "Event bookings could not be loaded.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void loadEvents(); }, []);
  useEffect(() => { void loadBookings(); }, [eventId, status, search]);

  const viewDetails = async (booking: EventBooking) => {
    const bookingId = String(booking.id ?? booking._id ?? "");
    if (!bookingId) return;
    setDetailLoading(true);
    try {
      setSelected(await vendorGetBooking(bookingId));
    } catch (error) {
      toast(error instanceof Error ? error.message : "Booking details could not be loaded.", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async (booking: EventBooking, nextStatus: string) => {
    const bookingId = String(booking.id ?? booking._id ?? "");
    if (!bookingId) return;
    setUpdatingId(bookingId);
    try {
      await vendorUpdateBookingStatus(bookingId, nextStatus);
      toast(`Booking ${nextStatus}.`, "success");
      await loadBookings(false);
      if (selected && String(selected.id ?? selected._id) === bookingId) {
        setSelected({ ...selected, status: nextStatus });
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Booking status could not be updated.", "error");
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <Header title="Event Bookings" />
      <main className="w-full space-y-7 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-sky-600">Booking management</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-800">Event bookings</h1><p className="mt-2 text-sm text-slate-500">View and manage booking requests for every event.</p></div>
          <div className="flex items-center gap-3">
            <label htmlFor="event-filter" className="sr-only">Select event</label>
            <div className="relative min-w-[240px]">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select id="event-filter" value={eventId} onChange={(event) => setEventId(event.target.value)} disabled={eventsLoading} className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-sky-400">
                <option value="">All events</option>
                {events.map((event) => <option key={event.id} value={event.id}>{event.title}{event.event_date ? ` — ${event.event_date}` : ""}</option>)}
              </select>
            </div>
            <button type="button" onClick={() => { void loadBookings(false); }} disabled={refreshing} className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-60"><RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />Refresh</button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search booking code or customer" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:border-sky-400" /></div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-sky-400"><option value="all">All statuses</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><h2 className="text-lg font-black text-slate-800">{eventId ? events.find((event) => event.id === eventId)?.title || "Selected event" : "All event bookings"}</h2><span className="text-sm font-bold text-slate-400">{total} booking{total === 1 ? "" : "s"}</span></div>
          {loading ? <div className="h-64 animate-pulse bg-slate-50" /> : bookings.length === 0 ? <div className="p-16 text-center text-sm font-semibold text-slate-400">No event bookings found for this selection.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead className="border-b border-slate-100 bg-slate-50/70"><tr>{["Booking", "Customer", "Date / time", "Tickets", "Status", "Payment", "Actions"].map((label) => <th key={label} className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{bookings.map((booking, index) => { const bookingId = String(value(booking, "id", "_id")); const currentStatus = String(value(booking, "status")); return <tr key={bookingId || index} className="hover:bg-sky-50/30"><td className="px-6 py-4 text-sm font-black text-sky-600">{value(booking, "booking_code", "id")}</td><td className="px-6 py-4 text-sm font-bold text-slate-800">{value(booking, "customer_name", "customer")}</td><td className="px-6 py-4"><p className="text-sm font-bold text-slate-700">{value(booking, "scheduled_date", "date")}</p><p className="text-xs text-slate-400">{value(booking, "scheduled_time", "time")}</p></td><td className="px-6 py-4 text-sm font-bold text-slate-700">{value(booking, "quantity", "guests", "guest_count")}</td><td className="px-6 py-4"><span className={cn("rounded-lg px-3 py-1 text-xs font-black uppercase", statusClass(currentStatus))}>{currentStatus}</span></td><td className="px-6 py-4 text-sm font-bold capitalize text-slate-400">{value(booking, "payment_status", "payment")}</td><td className="px-6 py-4"><div className="flex items-center gap-2"><button type="button" onClick={() => void viewDetails(booking)} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-sky-50 hover:text-sky-600"><Eye className="h-4 w-4" /></button>{["pending", "confirmed"].includes(currentStatus.toLowerCase()) ? <button type="button" disabled={updatingId === bookingId} onClick={() => void updateStatus(booking, currentStatus.toLowerCase() === "pending" ? "confirmed" : "complete")} className="rounded-lg bg-sky-500 px-3 py-2 text-xs font-black uppercase text-white disabled:opacity-50">{currentStatus.toLowerCase() === "pending" ? "Approve" : "Complete"}</button> : null}</div></td></tr>; })}</tbody></table></div>}
        </section>
      </main>

      {selected ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setSelected(null)}><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-sky-600">Booking details</p><h2 className="mt-2 text-2xl font-black text-slate-800">{String(value(selected, "booking_code", "id"))}</h2></div><button type="button" onClick={() => setSelected(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{[["Customer", value(selected, "customer_name", "customer")], ["Email", value(selected, "customer_email", "email")], ["Phone", value(selected, "customer_phone", "phone")], ["Event", value(selected, "service", "event_title")], ["Date", value(selected, "scheduled_date", "date")], ["Time", value(selected, "scheduled_time", "time")], ["Tickets", value(selected, "quantity", "guests", "guest_count")], ["Payment", value(selected, "payment_status", "payment")], ["Status", value(selected, "status")]].map(([label, item]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p><p className="mt-1 text-sm font-bold capitalize text-slate-700">{String(item)}</p></div>)}</div><div className="mt-6 flex flex-wrap gap-3">{["pending", "confirmed"].includes(String(value(selected, "status")).toLowerCase()) ? <button type="button" disabled={detailLoading} onClick={() => void updateStatus(selected, String(value(selected, "status")).toLowerCase() === "pending" ? "confirmed" : "complete")} className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{String(value(selected, "status")).toLowerCase() === "pending" ? "Approve booking" : "Mark completed"}</button> : null}<button type="button" disabled={detailLoading} onClick={() => void updateStatus(selected, "canceled")} className="rounded-xl bg-rose-50 px-5 py-3 text-sm font-black text-rose-600 disabled:opacity-50">Cancel booking</button></div></div></div> : null}
    </div>
  );
}
