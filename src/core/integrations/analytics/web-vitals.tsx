"use client";

/**
 * Reporta los Core Web Vitals (LCP, CLS, INP, FCP, TTFB) a GA4 si está
 * configurado — sin GA4 conectado, el componente no manda nada (no-op).
 *
 * Va en el layout del storefront junto a `<AnalyticsScripts/>`. El
 * `value` se redondea (CLS es decimal × 1000, los demás van en ms).
 */
import { useReportWebVitals } from "next/web-vitals";

import { hasGA } from "./config";

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (!hasGA || typeof window === "undefined" || !window.gtag) return;
    const value = Math.round(
      metric.name === "CLS" ? metric.value * 1000 : metric.value,
    );
    window.gtag("event", metric.name, {
      event_category: "Web Vitals",
      event_label: metric.id,
      value,
      non_interaction: true,
    });
  });

  return null;
}
