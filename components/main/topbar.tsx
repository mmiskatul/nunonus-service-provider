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
  "/settings": ""
};

export function Topbar({
  onOpenPanel
}: {
  onOpenPanel: (panel: "notifications" | "profile") => void;
}) {
  const pathname = usePathname();
  const title = pathname.startsWith("/settings")
    ? ""
    : (titleByRoute[pathname] ?? "Platform Overview");

  return (
    <header className="topbar">
      {title ? <h1 className="title">{title}</h1> : <div aria-hidden />}
      <div className="topbar-right">
        <button
          type="button"
          onClick={() => onOpenPanel("notifications")}
          className="relative inline-flex text-[#4d5f82]"
          aria-label="Notifications"
        >
          <FiBell size={18} />
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
        </button>
        <button type="button" onClick={() => onOpenPanel("profile")} className="avatar" aria-label="User Profile" />
      </div>
    </header>
  );
}
