"use client";

import React, { useEffect, useState } from "react";
import { X, Calendar, Star, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { vendorListNotifications, vendorMarkNotificationRead } from "@/lib/vendor-api";

interface NotificationItem {
  id: string;
  type: string;
  title?: string;
  message?: string;
  body?: string;
  created_at?: string;
  is_read?: boolean;
  read?: boolean;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    vendorListNotifications({ limit: 20, skip: 0 })
      .then((data) => {
        const raw = data as { items?: NotificationItem[] };
        setNotifications(raw?.items ?? []);
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleMarkRead = async (id: string) => {
    try {
      await vendorMarkNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, is_read: true, read: true } : n),
      );
    } catch {
      // non-critical — ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 mt-4 w-[480px] z-[100] animate-in fade-in zoom-in duration-200">
      <div className="bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-6 pb-3 flex items-center justify-between border-b border-slate-100/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-sky-50 rounded-xl flex items-center justify-center text-sky-500">
              <Bell className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Notifications</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl transition-all group">
            <X className="h-5 w-5 text-slate-300 group-hover:text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-slate-400 py-10 text-sm">No notifications yet.</div>
          ) : (
            notifications.map((notif) => {
              const isUnread = !(notif.is_read ?? notif.read ?? false);
              const isBooking = notif.type === "booking" || notif.type?.includes("booking");
              return (
                <div
                  key={notif.id}
                  onClick={() => isUnread && handleMarkRead(notif.id)}
                  className={cn(
                    "relative p-5 bg-white/50 rounded-3xl border transition-all group cursor-pointer",
                    isUnread ? "border-slate-100 hover:border-sky-200" : "border-slate-50 opacity-70",
                  )}
                >
                  {isUnread && <div className="absolute top-5 right-5 h-2 w-2 bg-[#1e2a5e] rounded-full" />}
                  <div className="flex gap-4">
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                      isBooking ? "bg-sky-50 text-sky-500" : "bg-amber-50 text-amber-500",
                    )}>
                      {isBooking ? <Calendar className="h-5 w-5" /> : <Star className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-black text-slate-800">
                          {notif.title ?? (isBooking ? "New Booking" : "New Notification")}
                        </h3>
                        {notif.created_at && (
                          <span className="text-[10px] font-bold text-slate-400">
                            {new Date(notif.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-slate-500 leading-relaxed pr-6 line-clamp-2">
                        {notif.message ?? notif.body ?? ""}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-6 pt-0 flex justify-center">
          <button className="text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">
            View all notifications
          </button>
        </div>
      </div>
    </div>
  );
}
