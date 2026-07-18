"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { DashboardShellProvider } from "@/components/DashboardShellContext";
import { vendorProfileQuery, vendorQueryKeys } from "@/lib/vendor-queries";
import {
  extractVendorCategories,
  getFallbackRouteForCategories,
  isRouteAllowedForCategories,
  VENDOR_CATEGORIES_UPDATED_EVENT,
} from "@/lib/vendor-access";

export default function MainLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const profileQuery = useQuery(vendorProfileQuery());
  const categories = profileQuery.data
    ? extractVendorCategories(profileQuery.data.categories ?? profileQuery.data.category)
    : extractVendorCategories("Restaurant");

  useEffect(() => {
    if (!profileQuery.data) return;
    const nextCategories = extractVendorCategories(
      profileQuery.data.categories ?? profileQuery.data.category,
    );
    if (!isRouteAllowedForCategories(pathname, nextCategories)) {
      router.replace(getFallbackRouteForCategories(nextCategories));
    }
  }, [pathname, profileQuery.data, router]);

  useEffect(() => {
    const handleCategoriesUpdated = (event: Event) => {
      const nextCategories = extractVendorCategories(
        (event as CustomEvent<unknown>).detail,
      );
      queryClient.invalidateQueries({ queryKey: vendorQueryKeys.profile });
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
  }, [pathname, queryClient, router]);

  const shellActions = useMemo(
    () => ({ openNavigation: () => setMobileNavigationOpen(true) }),
    [],
  );

  return (
    <DashboardShellProvider value={shellActions}>
      <div className="flex h-dvh overflow-hidden">
        <Sidebar
          categories={categories}
          mobileOpen={mobileNavigationOpen}
          onMobileClose={() => setMobileNavigationOpen(false)}
        />
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
      </div>
    </DashboardShellProvider>
  );
}
