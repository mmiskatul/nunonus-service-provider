"use client";

import { useReportWebVitals } from "next/web-vitals";

const reportedMetrics = new Set<string>();

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    const metricKey = `${window.location.pathname}:${metric.name}:${metric.id ?? ""}`;
    if (reportedMetrics.has(metricKey)) {
      return;
    }
    reportedMetrics.add(metricKey);

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
