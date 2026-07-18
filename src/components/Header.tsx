"use client";

import React from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";

import { Bell, Menu } from "lucide-react";
import { NotificationsModal } from "./NotificationsModal";
import Link from "next/link";
import { notificationsQuery, vendorProfileQuery } from "@/lib/vendor-queries";
import { useDashboardShell } from "@/components/DashboardShellContext";

interface HeaderProps {
  title?: string;
}

export function Header({ title = "Business Overview" }: HeaderProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const notificationRef = React.useRef<HTMLDivElement>(null);
  const { openNavigation } = useDashboardShell();
  const profileQuery = useQuery(vendorProfileQuery());
  const notifications = useQuery({ ...notificationsQuery(20, 0), enabled: isNotificationsOpen });
  const profile = profileQuery.data;
  const avatarUrl = String(profile?.avatar_url ?? profile?.profile_image_url ?? "");
  const notificationItems = (notifications.data as { items?: Array<{ is_read?: boolean; read?: boolean }> } | undefined)?.items ?? [];
  const unreadCount = notifications.data
    ? notificationItems.filter((item) => !(item.is_read ?? item.read ?? false)).length
    : Number(profile?.unread_notifications ?? 0);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    }

    if (isNotificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationsOpen]);

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-100 bg-white px-4 sm:px-6 md:h-24 md:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={openNavigation}
          aria-label="Open navigation"
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 md:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h2 className="truncate text-xl font-bold text-slate-800 sm:text-2xl md:text-3xl">{title}</h2>
      </div>

      <div className="flex items-center space-x-6">
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
            aria-expanded={isNotificationsOpen}
            className="cursor-pointer group p-2 hover:bg-slate-50 rounded-xl transition-all"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          >
            <Bell className="h-6 w-6 text-slate-400 group-hover:text-sky-500 transition-colors" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </button>

          <NotificationsModal
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
          />
        </div>

        <Link
          href="/profile"
          className="flex items-center space-x-3 cursor-pointer group"
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt="User profile" width={48} height={48} sizes="48px" className="h-10 w-10 rounded-full border-2 border-slate-200 object-cover transition-all group-hover:border-sky-400 md:h-12 md:w-12" />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-100 text-sm font-black text-slate-500 md:h-12 md:w-12">SP</span>
          )}
        </Link>
      </div>
    </header>
  );
}
