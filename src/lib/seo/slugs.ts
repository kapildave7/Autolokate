import type { Car } from "@/data/types";

/** Lowercase URL segment: letters, digits, hyphens only. */
export function slugifyPart(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/**
 * SEO car path segment: brand-model-year-city-id
 * Example: maruti-suzuki-swift-2018-mumbai-car-000001
 */
export function buildCarListingSlug(car: Car): string {
  return [slugifyPart(car.brand), slugifyPart(car.model), String(car.year), slugifyPart(car.city), car.id].join("-");
}

/** Legacy bare id: car-000001, or extract id from full SEO slug. */
export function parseCarIdFromParam(param: string): string | null {
  if (/^car-\d+$/i.test(param)) return param.toLowerCase();
  const m = param.match(/-(car-\d+)$/i);
  return m ? m[1].toLowerCase() : null;
}

export function listingSlugMatchesCar(slug: string, car: Car): boolean {
  return buildCarListingSlug(car) === slug.toLowerCase();
}

export function buildCompareSlug(ids: string[]): string {
  return ids
    .filter(Boolean)
    .slice(0, 3)
    .join("-vs-")
    .toLowerCase();
}

export function parseCompareSlug(slug: string): string[] {
  return slug
    .split("-vs-")
    .map((s) => s.trim())
    .filter((s) => /^car-\d+$/i.test(s))
    .map((s) => s.toLowerCase());
}
