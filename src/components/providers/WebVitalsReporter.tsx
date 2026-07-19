"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    const payload = JSON.stringify({
      id: metric.id,
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      navigationType: metric.navigationType,
      path: window.location.pathname,
    });
    const beacon = new Blob([payload], { type: "application/json" });
    if (!navigator.sendBeacon("/api/telemetry/web-vitals", beacon)) {
      void fetch("/api/telemetry/web-vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      });
    }
  });
  return null;
}
