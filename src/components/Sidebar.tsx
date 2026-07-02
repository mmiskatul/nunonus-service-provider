"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getSidebarItemsForCategories,
  type VendorCategory,
} from "@/lib/vendor-access";

export function Sidebar({ categories }: { categories: VendorCategory[] }) {
  const pathname = usePathname();
  const navItems = getSidebarItemsForCategories(categories);

  return (
    <div className="flex bg-[#1e2a5e] h-screen w-20 md:w-64 flex-col text-white transition-all duration-300 ease-in-out border-r border-white/5">
      <div className="flex h-24 items-center justify-center md:justify-start px-0 md:px-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          <span className="md:hidden">L</span>
          <span className="hidden md:inline">Logo</span>
        </h1>
      </div>

      <nav className="flex-1 space-y-2 px-3 md:px-4 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center justify-center md:justify-start rounded-xl px-0 md:px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-[#38bdf8] text-black shadow-lg shadow-sky-500/20"
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
                  "md:mr-3",
                )}
              />
              <span className="hidden md:inline truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 md:px-4 py-6 border-t border-white/10">
        <button className="flex w-full items-center justify-center md:justify-start rounded-xl px-0 md:px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white group">
          <LogOut className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-white transition-colors md:mr-3" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </div>
  );
}
