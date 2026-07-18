"use client";

import { createContext, useContext } from "react";

const DashboardShellContext = createContext<{ openNavigation: () => void }>({
  openNavigation: () => undefined,
});

export const DashboardShellProvider = DashboardShellContext.Provider;

export function useDashboardShell() {
  return useContext(DashboardShellContext);
}
