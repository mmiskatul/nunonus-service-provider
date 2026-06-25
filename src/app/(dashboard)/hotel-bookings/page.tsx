"use client";

import { useState, useEffect, useCallback } from "react";
import { parse, isWithinInterval, startOfDay } from "date-fns";
import { BookingsHeader } from "@/components/BookingsHeader";
import { HotelBookingsTable } from "@/components/HotelBookingsTable";
import {
  HotelBooking,
  HotelBookingDetailsModal,
} from "@/components/HotelBookingDetailsModal";
import { Pagination } from "@/components/Pagination";
import { vendorListBookings } from "@/lib/vendor-api";

const ITEMS_PER_PAGE = 10;

function mapStatus(raw: string): HotelBooking["status"] {
  const s = (raw ?? "").toLowerCase().trim();
  if (s === "confirmed") return "CONFIRMED";
  if (s === "pending") return "PENDING";
  if (s === "cancelled" || s === "canceled") return "CANCELLED";
  if (s === "check_in" || s === "check in") return "CHECK IN";
  if (s === "complete" || s === "completed") return "COMPLETE";
  return "PENDING";
}

function toHotelBooking(raw: Record<string, unknown>): HotelBooking {
  const guests = raw.guests ?? raw.guest_count ?? raw.num_guests ?? 1;
  const ratePerNight = Number(raw.rate_per_night ?? raw.base_price ?? raw.price_per_night ?? 0);
  const totalAmount = Number(raw.total_amount ?? 0);
  const serviceFee = Number(raw.service_fee ?? 0);
  const tourismTax = Number(raw.tourism_tax ?? raw.tax ?? 0);
  const nights = Number(raw.nights ?? raw.num_nights ?? 1);

  return {
    id: String(raw.booking_code ?? raw.id ?? "#—"),
    customer: {
      name: String(raw.customer_name ?? "Guest"),
      avatar: String(raw.customer_avatar ?? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop"),
      since: raw.customer_since ? String(raw.customer_since) : new Date().getFullYear().toString(),
    },
    checkIn: String(raw.check_in_date ?? raw.scheduled_date ?? "—"),
    checkOut: String(raw.check_out_date ?? "—"),
    nights: nights || 1,
    roomType: String(raw.room_type ?? raw.service ?? raw.listing_type ?? "Room"),
    roomNumber: String(raw.room_number ?? raw.room_name ?? "—"),
    ratePerNight: ratePerNight || (totalAmount - serviceFee - tourismTax) / (nights || 1),
    serviceFee,
    tourismTax,
    status: mapStatus(String(raw.status ?? "")),
    payment: (raw.payment_status === "paid" || raw.payment === "Paid") ? "Paid" : "Unpaid",
    phone: String(raw.customer_phone ?? "—"),
    email: String(raw.customer_email ?? "—"),
    specialRequests: String(raw.special_requests ?? raw.notes ?? ""),
    guests: `${guests} Guest${Number(guests) !== 1 ? "s" : ""}`,
  };
}

export default function HotelBookingsPage() {
  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedBooking, setSelectedBooking] = useState<HotelBooking | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params: Parameters<typeof vendorListBookings>[0] = {
        limit: ITEMS_PER_PAGE,
        skip: (currentPage - 1) * ITEMS_PER_PAGE,
        search: searchQuery || undefined,
        status: statusFilter !== "All" ? statusFilter : undefined,
        date_from: dateRange.start ? dateRange.start.toISOString().split("T")[0] : undefined,
        date_to: dateRange.end ? dateRange.end.toISOString().split("T")[0] : undefined,
      };
      const raw = await vendorListBookings(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined)) as typeof params,
      ) as { items?: Record<string, unknown>[]; total?: number };
      setBookings((raw?.items ?? []).map(toHotelBooking));
      setTotal(raw?.total ?? 0);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, dateRange]);

  useEffect(() => { void fetchBookings(); }, [fetchBookings]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const handleSearchChange = (query: string) => { setSearchQuery(query); setCurrentPage(1); };
  const handleStatusChange = (s: string) => { setStatusFilter(s); setCurrentPage(1); };
  const handleDateRangeChange = (range: { start: Date | null; end: Date | null }) => {
    setDateRange(range); setCurrentPage(1);
  };

  return (
    <div className="min-h-screen p-4 md:p-10 overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto">
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
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <HotelBookingsTable bookings={bookings} onViewDetails={setSelectedBooking} />
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={(page) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); }}
        />
      </div>

      <HotelBookingDetailsModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />
    </div>
  );
}
