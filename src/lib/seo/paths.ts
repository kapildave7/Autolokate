import type { Car } from "@/data/types";
import { cityToSlug } from "./resolvers";
import { buildCarListingSlug, buildCompareSlug, slugifyPart } from "./slugs";

export function carDetailPath(car: Car): string {
  return `/cars/${buildCarListingSlug(car)}`;
}

/** Shareable compare URL using catalogue variant IDs (query string — supports UUIDs). */
export function comparePathForIds(ids: string[]): string {
  const filtered = ids.filter(Boolean).slice(0, 3);
  if (filtered.length === 0) return "/compare";
  return `/compare?ids=${filtered.map((id) => encodeURIComponent(id)).join(",")}`;
}

/** @deprecated Legacy slug format only matched `car-*` listing ids; prefer `comparePathForIds`. */
export function compareSlugPathForLegacyListingIds(ids: string[]): string {
  const filtered = ids.filter(Boolean).slice(0, 3);
  if (filtered.length === 0) return "/compare";
  return `/compare/${buildCompareSlug(filtered)}`;
}

/** Side-by-side compare for catalogue variant IDs (not inventory listing ids). */
export function catalogueComparePath(variantIds: string[]): string {
  const safe = variantIds.filter(Boolean).slice(0, 3);
  if (safe.length < 2) return "/compare/catalogue";
  const q = safe.map((id) => encodeURIComponent(id)).join(",");
  return `/compare/catalogue?ids=${q}`;
}

export function usedCarsBasePath(): string {
  return "/used-cars";
}

export function usedCarsCityPath(city: string): string {
  return `/used-cars/${cityToSlug(city)}`;
}

export function usedCarsCityBrandPath(city: string, brand: string): string {
  return `${usedCarsCityPath(city)}/${slugifyPart(brand)}`;
}

export function usedCarsCityBrandModelPath(city: string, brand: string, model: string): string {
  return `${usedCarsCityBrandPath(city, brand)}/${slugifyPart(model)}`;
}

export function usedCarsListingPath(car: Car): string {
  return `${usedCarsCityBrandModelPath(car.city, car.brand, car.model)}/${car.id}`;
}

export function newCarsBasePath(): string {
  return "/new-cars";
}

export function newCarsBrandPath(brand: string): string {
  return `${newCarsBasePath()}/${slugifyPart(brand)}`;
}

export function newCarsBrandModelPath(brand: string, model: string): string {
  return `${newCarsBrandPath(brand)}/${slugifyPart(model)}`;
}

export function newCarsVariantPath(brand: string, model: string, variant: string): string {
  return `${newCarsBrandModelPath(brand, model)}/${slugifyPart(variant)}`;
}
