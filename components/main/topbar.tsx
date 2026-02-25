"use client";

import { FiBell } from "react-icons/fi";
import { usePathname } from "next/navigation";

const titleByRoute: Record<string, string> = {
  "/dashboard": "Platform Overview",
  "/users": "User Management",
  "/vendors": "Vendors Management",
  "/content-moderation": "Content Management",
  "/offers": "Offers",
  "/billing": "Billing",
  "/support": "Support",
  "/settings": "Settings"
};

export function Topbar() {
  const pathname = usePathname();
  const title = titleByRoute[pathname] ?? "Platform Overview";

  return (
    <header className="topbar">
      <h1 className="title">{title}</h1>
      <div className="topbar-right">
        <span className="relative inline-flex text-[#4d5f82]">
          <FiBell size={18} />
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
        </span>
        <div className="avatar" />
      </div>
    </header>
  );
}
