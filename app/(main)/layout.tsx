"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { getVendorToken, vendorGetProfileSettings } from "@/lib/vendor-api";
import {
  extractVendorCategories,
  getFallbackRouteForCategories,
  isRouteAllowedForCategories,
  readCachedVendorCategories,
  VENDOR_CATEGORIES_UPDATED_EVENT,
  type VendorCategory,
} from "@/lib/vendor-access";

export default function MainLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [categories, setCategories] = useState<VendorCategory[]>(["Restaurant"]);

  useEffect(() => {
    const token = getVendorToken();
    if (!token) {
      const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "";
      const redirectUrl = currentPath ? `/auth/login?next=${encodeURIComponent(currentPath)}` : "/auth/login";
      router.replace(redirectUrl);
      return;
    }

    const cachedCategories = readCachedVendorCategories();
    setCategories(cachedCategories);

    vendorGetProfileSettings()
      .then((profile) => {
        const nextCategories = extractVendorCategories(
          profile.categories ?? profile.category,
        );
        setCategories(nextCategories);
        if (!isRouteAllowedForCategories(pathname, nextCategories)) {
          router.replace(getFallbackRouteForCategories(nextCategories));
          return;
        }
        setAuthorized(true);
      })
      .catch(() => {
        if (!isRouteAllowedForCategories(pathname, cachedCategories)) {
          router.replace(getFallbackRouteForCategories(cachedCategories));
          return;
        }
        setAuthorized(true);
      });
  }, [pathname, router]);

  useEffect(() => {
    const handleCategoriesUpdated = (event: Event) => {
      const nextCategories = extractVendorCategories(
        (event as CustomEvent<unknown>).detail,
      );
      setCategories(nextCategories);
      if (!isRouteAllowedForCategories(pathname, nextCategories)) {
        router.replace(getFallbackRouteForCategories(nextCategories));
      }
    };

    window.addEventListener(VENDOR_CATEGORIES_UPDATED_EVENT, handleCategoriesUpdated);
    return () => {
      window.removeEventListener(
        VENDOR_CATEGORIES_UPDATED_EVENT,
        handleCategoriesUpdated,
      );
    };
  }, [pathname, router]);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="animate-pulse font-medium text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar categories={categories} />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
    </div>
  );
}
