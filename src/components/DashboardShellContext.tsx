"use client";

import { createContext, useContext } from "react";

const DashboardShellContext = createContext<{
  openNavigation: () => void;
  hasGlobalHeader: boolean;
}>({
  openNavigation: () => undefined,
  hasGlobalHeader: false,
});

export const DashboardShellProvider = DashboardShellContext.Provider;

export function useDashboardShell() {
  return useContext(DashboardShellContext);
}
