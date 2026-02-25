"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { GoGift, GoPeople } from "react-icons/go";
import { LiaHeadsetSolid } from "react-icons/lia";
import { LuLayoutDashboard } from "react-icons/lu";
import { TbBuildingStore, TbNotebook } from "react-icons/tb";
import { FiCreditCard, FiLogOut, FiSettings } from "react-icons/fi";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LuLayoutDashboard /> },
  { href: "/users", label: "Users", icon: <GoPeople /> },
  { href: "/vendors", label: "Vendors", icon: <TbBuildingStore /> },
  { href: "/content-moderation", label: "Content Moderation", icon: <TbNotebook /> },
  { href: "/offers", label: "Offers", icon: <GoGift /> },
  { href: "/billing", label: "Billing", icon: <FiCreditCard /> },
  { href: "/support", label: "Support", icon: <LiaHeadsetSolid /> },
  { href: "/settings", label: "Settings", icon: <FiSettings /> }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col border-r border-white/10 bg-[var(--bg-sidebar)] text-[#f7f9ff]">
      <div className="border-b border-white/10 px-[22px] py-[20px] text-[30px] font-bold">
        Logo
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-[10px] py-[14px]">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (pathname === "/" && item.href === "/dashboard");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#e9efff] transition-colors hover:bg-white/15 ${
                isActive ? "bg-[var(--bg-sidebar-accent)] text-[#0f2b55] font-semibold" : ""
              }`}
            >
              <span className="flex h-[22px] w-[22px] items-center justify-center text-[22px] leading-none">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-[10px] py-[14px]">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#e9efff] transition-colors hover:bg-white/15"
        >
          <span className="flex h-[22px] w-[22px] items-center justify-center text-[22px] leading-none">
            <FiLogOut />
          </span>
          <span>Logout</span>
        </Link>
      </div>
    </aside>
  );
}
