"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronRight,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getSidebarItemsForCategories,
  type VendorCategory,
} from "@/lib/vendor-access";
import { clearVendorTokens } from "@/lib/vendor-api";

export function Sidebar({
  categories,
  mobileOpen = false,
  onMobileClose,
}: {
  categories: VendorCategory[];
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = getSidebarItemsForCategories(categories);
  const groups = [
    { label: "Overview", hrefs: ["/dashboard", "/analytics"] },
    { label: "Operations", hrefs: ["/customers", "/events", "/restaurant-bookings", "/hotel-bookings", "/services", "/hotel-services", "/spa-services"] },
    { label: "Engagement", hrefs: ["/promotions", "/loyalty", "/reviews"] },
    { label: "Account", hrefs: ["/settings", "/profile", "/notifications"] },
  ];
  const groupedItems = groups.map((group) => ({
    ...group,
    items: group.hrefs.map((href) => navItems.find((item) => item.href === href)).filter((item): item is typeof navItems[number] => Boolean(item)),
  })).filter((group) => group.items.length > 0);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      clearVendorTokens();
      router.replace("/auth/login");
    }
  };

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] md:hidden"
          onClick={onMobileClose}
        />
      ) : null}
      <aside
        aria-label="Main navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/5 bg-[#1e2a5e] text-white shadow-2xl transition-transform duration-200 md:static md:z-auto md:w-64 md:translate-x-0 md:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
      <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-5 md:h-24 md:px-6">
        <Link href="/dashboard" onClick={onMobileClose} className="flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400 text-lg font-black text-[#1e2a5e] shadow-lg shadow-sky-950/20">N</span>
          <span><span className="block text-lg font-black tracking-tight">Nunonus</span><span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">Provider portal</span></span>
        </Link>
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onMobileClose}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5 md:px-4" aria-label="Portal sections">
        {groupedItems.map((group) => <div key={group.label} className="mb-6 last:mb-0">
          <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400/80">{group.label}</p>
          <div className="space-y-1">
          {group.items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={false}
              onClick={onMobileClose}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex min-h-11 items-center rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
                isActive
                  ? "bg-sky-400 text-[#12204f] shadow-lg shadow-sky-950/20"
                  : "text-slate-300 hover:bg-white/10 hover:text-white",
              )}
              title={item.name}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive
                    ? "text-black"
                    : "text-slate-400 group-hover:text-white",
                  "mr-3",
                )}
              />
              <span className="truncate">{item.name}</span>
              <ChevronRight className={cn("ml-auto h-4 w-4 transition-opacity", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60")} />
            </Link>
          );
          })}
          </div>
        </div>)}
      </nav>

      <div className="shrink-0 border-t border-white/10 px-3 py-4 md:px-4">
        <button type="button" onClick={handleLogout} className="group flex min-h-11 w-full items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:bg-red-400/10 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300">
          <LogOut className="mr-3 h-5 w-5 shrink-0 text-slate-400 transition-colors group-hover:text-white" />
          <span>Logout</span>
        </button>
      </div>
      </aside>
    </>
  );
}
