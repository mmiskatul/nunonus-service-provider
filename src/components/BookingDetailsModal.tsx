"use client";

import React, { useState } from "react";
import {
  X,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  Calendar,
  Printer,
  Trash2,
} from "lucide-react";
import { Booking } from "./BookingsTable";
import { cn } from "@/lib/utils";

interface BookingDetailsModalProps {
  booking: Booking | null;
  onClose: () => void;
  onUpdateStatus: (status: string) => void;
  onReschedule: (date: string, time: string) => void;
  onGenerateReceipt: () => void;
}

export function BookingDetailsModal({
  booking,
  onClose,
  onUpdateStatus,
  onReschedule,
  onGenerateReceipt,
}: BookingDetailsModalProps) {
  const [rescheduling, setRescheduling] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-[440px] bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div className="p-8 pb-6 flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-500 mb-1 block">
              Booking Details
            </span>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
              {booking.id}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-2xl transition-all group"
          >
            <X className="h-6 w-6 text-slate-300 group-hover:text-slate-600 transition-colors" />
          </button>
        </div>

        <div className="px-8 pb-8 space-y-8">
          {/* Status & Time Info */}
          <div className="flex items-center justify-between border-t border-slate-50 pt-6">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold tracking-wide",
                booking.status === "Confirmed" &&
                  "bg-emerald-50 text-emerald-600",
                booking.status === "Pending" && "bg-amber-50 text-amber-600",
                booking.status === "Cancelled" && "bg-rose-50 text-rose-600",
                booking.status === "Complete" && "bg-sky-50 text-sky-600",
              )}
            >
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  booking.status === "Confirmed" && "bg-emerald-500",
                  booking.status === "Pending" && "bg-amber-500",
                  booking.status === "Cancelled" && "bg-rose-500",
                  booking.status === "Complete" && "bg-sky-500",
                )}
              />
              {booking.status}
            </span>
            <span className="text-xs font-medium text-slate-400">
              Booking made 2 hours ago
            </span>
          </div>

          {/* Customer Info */}
          <div className="flex items-center gap-4">
            {booking.customer.avatar ? <img src={booking.customer.avatar} alt={booking.customer.name} className="h-20 w-20 rounded-[28px] border-4 border-slate-50 object-cover shadow-sm" /> : <span className="flex h-20 w-20 items-center justify-center rounded-[28px] border-4 border-slate-50 bg-slate-100 text-xl font-black text-slate-500">{booking.customer.name.slice(0, 1).toUpperCase()}</span>}
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">
                {booking.customer.name}
              </h3>
              <p className="text-sm font-medium text-slate-400">{booking.customerSince ? `Customer since ${booking.customerSince}` : "Customer"}</p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-3xl border border-slate-50 group hover:border-slate-100 transition-all">
              <div className="h-10 w-10 flex items-center justify-center bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-sky-500 transition-colors">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Phone
                </span>
                <span className="text-sm font-bold text-slate-700">
                  {booking.phone || "Not provided"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-3xl border border-slate-50 group hover:border-slate-100 transition-all">
              <div className="h-10 w-10 flex items-center justify-center bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-sky-500 transition-colors">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Email
                </span>
                <span className="text-sm font-bold text-slate-700">
                  {booking.email || "Not provided"}
                </span>
              </div>
            </div>
          </div>

          {/* Special Requests */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <FileText className="h-4 w-4 text-sky-500" />
              <span className="text-sm font-bold text-slate-800">
                Special Requests
              </span>
            </div>
            <div className="p-5 bg-orange-50/50 rounded-[32px] border border-orange-100/50">
              <p className="text-sm font-medium leading-relaxed text-orange-800/80">
                {booking.specialRequests || "No special requests provided."}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <button type="button" onClick={() => onUpdateStatus("complete")} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 rounded-[22px] shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
              <CheckCircle2 className="h-5 w-5" />
              Mark Completed
            </button>
            <button type="button" onClick={() => setRescheduling((value) => !value)} className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-4 rounded-[22px] border border-slate-100 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
              <Calendar className="h-5 w-5 text-slate-400" />
              Reschedule
            </button>
            {rescheduling ? <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4"><div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-slate-500">Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label><label className="text-xs font-bold text-slate-500">Time<input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label></div><button type="button" disabled={!date || !time} onClick={() => { onReschedule(date, time); setRescheduling(false); }} className="w-full rounded-xl bg-[#1e2a5e] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">Confirm new time</button></div> : null}

            <div className="flex items-center justify-between px-6 pt-4">
              <button type="button" onClick={() => onUpdateStatus("cancelled")} className="text-[11px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors">
                Cancel Booking
              </button>
              <button type="button" onClick={onGenerateReceipt} className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-500 transition-colors">
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
