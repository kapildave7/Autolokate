/**
 * Google Analytics 4 (gtag) — lightweight client-side events.
 *
 * Convention:
 * - Prefer specific `event` names (snake_case) for primary funnels.
 * - Add `event_category`, `event_action`, `event_label` on any event for cross-cutting reports
 *   (maps to GA4 custom dimensions if registered).
 * - Keep param values short; no PII in free-text fields.
 */

import type { Car } from "@/data/types";
import type { CarFilters } from "@/data";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** Register in GA4 as custom dimensions if you want breakdowns in standard reports. */
export const GA_CATEGORIES = {
  navigation: "navigation",
  engagement: "engagement",
  cars_catalog: "cars_catalog",
  car_detail: "car_detail",
  compare: "compare",
  conversion: "conversion",
  search: "search",
  forms: "forms",
  home: "home",
  checkout: "checkout",
  media: "media",
} as const;

export type GaCategory = (typeof GA_CATEGORIES)[keyof typeof GA_CATEGORIES];

function publicGaId(): string | undefined {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
}

/** GA4 accepts string | number | boolean for params. */
export function sanitizeGaParams(params: Record<string, unknown>): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "boolean") {
      out[k] = v;
      continue;
    }
    if (typeof v === "number") {
      if (!Number.isFinite(v)) continue;
      out[k] = v;
      continue;
    }
    if (typeof v === "string") {
      out[k] = v.length > 120 ? `${v.slice(0, 117)}…` : v;
      continue;
    }
    out[k] = String(v).slice(0, 120);
  }
  return out;
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, sanitizeGaParams(params));
}

/**
 * SPA / soft navigation page views (pathname + query).
 * Initial HTML load still gets automatic page_view from gtag config.
 */
export function trackPageView(pagePath: string) {
  const id = publicGaId();
  if (!id || typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("config", id, {
    page_path: pagePath,
    page_location: window.location.href,
    page_title: typeof document !== "undefined" ? document.title : undefined,
  });
}

/** UA-style bucket → single GA4 event with standard param names for exploration + BigQuery. */
export function trackStructuredInteraction(args: {
  category: GaCategory | string;
  action: string;
  label?: string;
} & Record<string, unknown>): void {
  const { category, action, label, ...rest } = args;
  trackEvent("custom_interaction", {
    event_category: category,
    event_action: action,
    ...(label != null ? { event_label: label } : {}),
    ...rest,
  });
}

export function carEntityParams(car: Pick<Car, "id" | "brand" | "model" | "year" | "price" | "city" | "fuel" | "bodyType">) {
  return {
    car_id: car.id,
    car_brand: car.brand,
    car_model: car.model,
    car_year: car.year,
    price_inr: car.price,
    car_city: car.city,
    car_fuel: car.fuel,
    car_body_type: car.bodyType,
  };
}

/** Summarise active filters for analytics (no raw keyword text — length only). */
export function carFiltersAnalyticsSummary(f: CarFilters): Record<string, string | number | boolean> {
  const groups: string[] = [];
  if (f.query?.trim()) groups.push("query");
  if (f.brand) groups.push("brand");
  if (f.model) groups.push("model");
  if (f.variant) groups.push("variant");
  if (f.city) groups.push("city");
  if (f.bodyType) groups.push("bodyType");
  if (f.fuel) groups.push("fuel");
  if (f.transmission) groups.push("transmission");
  if (f.exteriorColor) groups.push("color");
  if (f.sellerType) groups.push("sellerType");
  if (f.minPrice != null || f.maxPrice != null) groups.push("price");
  if (f.maxEmi != null) groups.push("emi");
  if (f.minDiscount != null) groups.push("discount");
  if (f.minYear != null || f.maxYear != null) groups.push("year");
  if (f.maxOwners != null) groups.push("owners");
  if (f.certifiedOnly) groups.push("certified");
  if (f.isNew === true) groups.push("new_only");
  if (f.isNew === false) groups.push("used_only");
  const q = f.query?.trim();
  return {
    filter_group_count: groups.length,
    filter_groups: groups.join(","),
    query_length: q ? Math.min(q.length, 99) : 0,
    sort: f.sort ?? "newest",
  };
}
