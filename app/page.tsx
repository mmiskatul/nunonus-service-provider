"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getVendorToken } from "@/lib/vendor-api";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getVendorToken();
    if (token) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
      <div className="animate-pulse font-medium text-slate-400">Loading...</div>
    </div>
  );
}
