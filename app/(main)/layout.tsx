"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { getVendorToken } from "@/lib/vendor-api";

export default function MainLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = getVendorToken();
    if (!token) {
      const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "";
      const redirectUrl = currentPath ? `/auth/login?next=${encodeURIComponent(currentPath)}` : "/auth/login";
      router.replace(redirectUrl);
      return;
    }
    setAuthorized(true);
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="animate-pulse font-medium text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
    </div>
  );
}
