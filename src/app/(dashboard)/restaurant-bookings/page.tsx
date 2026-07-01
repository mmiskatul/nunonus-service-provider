"use client";

import { useCallback, useEffect, useState } from "react";
import { parse, isWithinInterval, startOfDay } from "date-fns";
import { BookingsHeader } from "@/components/BookingsHeader";
import { BookingsTable, type Booking } from "@/components/BookingsTable";
import { Pagination } from "@/components/Pagination";
import { BookingDetailsModal } from "@/components/BookingDetailsModal";
import { vendorListBookings } from "@/lib/vendor-api";

const ITEMS_PER_PAGE = 10;

function normalizeStatus(raw: unknown): Booking["status"] {
  const value = String(raw ?? "").toLowerCase().trim();
  if (value === "confirmed") return "Confirmed";
  if (value === "pending") return "Pending";
  if (value === "cancelled" || value === "canceled") return "Cancelled";
  if (value === "complete" || value === "completed") return "Complete";
  return "Pending";
}

function toBooking(raw: Record<string, unknown>): Booking {
  const customerName = String(raw.customer_name ?? raw.customer ?? "Guest");
  const avatarSeed = encodeURIComponent(customerName || String(raw.id ?? "guest"));
  return {
    id: String(raw.booking_code ?? raw.id ?? "Booking"),
    customer: {
      name: customerName,
      avatar:
        String(raw.customer_avatar ?? raw.avatar_url ?? "").trim() ||
        `https://i.pravatar.cc/80?u=${avatarSeed}`,
    },
    date: String(raw.date ?? raw.scheduled_date ?? raw.check_in_date ?? "—"),
    time: String(raw.time ?? raw.scheduled_time ?? "—"),
    guests: Number(raw.guests ?? raw.guest_count ?? raw.num_guests ?? 1),
    service: String(raw.service ?? raw.room_type ?? raw.listing_type ?? "Booking"),
    status: normalizeStatus(raw.status),
    payment: String(raw.payment_status ?? raw.payment ?? "Unpaid")
      .toLowerCase() === "paid"
      ? "Paid"
      : "Unpaid",
  };
}

export default function RestaurantBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        limit: ITEMS_PER_PAGE,
        skip: (currentPage - 1) * ITEMS_PER_PAGE,
        search: searchQuery || undefined,
        status: statusFilter !== "All" ? statusFilter : undefined,
        date_from: dateRange.start ? dateRange.start.toISOString().split("T")[0] : undefined,
        date_to: dateRange.end ? dateRange.end.toISOString().split("T")[0] : undefined,
      };
      const raw = (await vendorListBookings(
        Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined)),
      )) as { items?: Record<string, unknown>[]; bookings?: Record<string, unknown>[]; total?: number };
      const nextItems = raw.items ?? raw.bookings ?? [];
      setBookings(nextItems.map(toBooking));
      setTotal(raw.total ?? nextItems.length);
    } catch {
      setBookings([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, dateRange.end, dateRange.start, searchQuery, statusFilter]);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || booking.status === statusFilter;
    const bookingDate = parse(booking.date, "MMM d, yyyy", new Date());
    const matchesRange =
      !dateRange.start ||
      !dateRange.end ||
      (Number.isNaN(bookingDate.getTime()) ? true : isWithinInterval(startOfDay(bookingDate), {
        start: startOfDay(dateRange.start),
        end: startOfDay(dateRange.end),
      }));

    return matchesSearch && matchesStatus && matchesRange;
  });

  const totalPages = Math.max(1, Math.ceil((total || filteredBookings.length) / ITEMS_PER_PAGE));

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (range: { start: Date | null; end: Date | null }) => {
    setDateRange(range);
    setCurrentPage(1);
  };

  const pageItems = filteredBookings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen p-4 md:p-10 overflow-x-hidden">
      <div className="mx-auto max-w-[1400px]">
        <BookingsHeader
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusChange={handleStatusChange}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
        />

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          </div>
        ) : pageItems.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-sm text-slate-400">
            No bookings found.
          </div>
        ) : (
          <BookingsTable bookings={pageItems} onViewDetails={setSelectedBooking} />
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total || filteredBookings.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={(page) => {
            if (page >= 1 && page <= totalPages) {
              setCurrentPage(page);
            }
          }}
        />
      </div>

      <BookingDetailsModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
    </div>
  );
}
