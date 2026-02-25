"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/users", label: "Users", icon: "◎" },
  { href: "/vendors", label: "Vendors", icon: "⌂" },
  { href: "/content-moderation", label: "Content Moderation", icon: "◫" },
  { href: "/offers", label: "Offers", icon: "◧" },
  { href: "/billing", label: "Billing", icon: "⎙" },
  { href: "/support", label: "Support", icon: "◌" },
  { href: "/settings", label: "Settings", icon: "⚙" }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">Logo</div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (pathname === "/" && item.href === "/dashboard");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <Link href="/" className="nav-item">
          <span>↪</span>
          <span>Logout</span>
        </Link>
      </div>
    </aside>
  );
}
