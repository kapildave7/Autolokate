export * from "./types";
export { companies } from "./companies";
export { cars } from "./cars";
export { bikes } from "./bikes";
export {
  articles,
  blogPosts,
  getArticleBySlug,
  getArticlesByCategory,
  trendingTopics,
} from "./blog";
export { videos, getVideoBySlug } from "./videos";
export { platformReviews, getReviewsForCompany } from "./reviews";
export { chatThreadsSeed } from "./chat-seed";

import { cars } from "./cars";
import { companies } from "./companies";
import type { Car, SellerType } from "./types";
import { slugifyPart } from "@/lib/seo/slugs";

export function getCarById(id: string): Car | undefined {
  return cars.find((c) => c.id === id);
}

export function getCompanyBySlug(slug: string) {
  return companies.find((c) => c.slug === slug);
}

export function getCarsByCompanyId(companyId: string): Car[] {
  return cars.filter((c) => c.companyId === companyId);
}

export const brands = [...new Set(cars.map((c) => c.brand))].sort();

/** Deterministic shuffle for “explore all” — stable for SSR/CSR, feels mixed vs default sort. */
export function seededShuffle<T>(items: readonly T[], seedStr: string): T[] {
  const out = [...items];
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  for (let i = out.length - 1; i > 0; i--) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Catalog order for /cars/explore (mixed brands, non-chronological). */
export const carsExploreCatalog = seededShuffle(cars, "autolokate-explore-catalog-v1");

export function resolveBrandFromSlug(slug: string): string | undefined {
  const s = slug.toLowerCase();
  return brands.find((b) => slugifyPart(b) === s);
}

export const indianCities = [...new Set(cars.map((c) => c.city))].sort();

export const bodyTypes = [...new Set(cars.map((c) => c.bodyType))].sort();

export const exteriorColors = [...new Set(cars.map((c) => c.exteriorColor))].sort();

export function getSimilarCars(car: Car, limit = 4): Car[] {
  const pool = cars.filter(
    (c) => c.id !== car.id && (c.bodyType === car.bodyType || c.brand === car.brand)
  );
  const n = parseInt(car.id.replace(/\D/g, "") || "0", 10);
  if (pool.length <= limit) return pool;
  const start = n % (pool.length - limit + 1);
  return pool.slice(start, start + limit);
}

export function getRecommendedCars(seed = 0, limit = 6): Car[] {
  const start = seed % Math.max(1, cars.length - limit);
  return [...cars.slice(start), ...cars.slice(0, start)].slice(0, limit);
}

export function getBestDeals(limit = 6): Car[] {
  return [...cars].sort((a, b) => b.discountPercent - a.discountPercent).slice(0, limit);
}

export type CarFilters = {
  /** Free-text across brand, model, variant, city */
  query?: string;
  brand?: string;
  /** Exact model name (SEO hub pages) */
  model?: string;
  /** Exact variant label (new-car trim pages) */
  variant?: string;
  minPrice?: number;
  maxPrice?: number;
  maxEmi?: number;
  minDiscount?: number;
  fuel?: string;
  transmission?: string;
  minYear?: number;
  maxYear?: number;
  maxOwners?: number;
  city?: string;
  certifiedOnly?: boolean;
  isNew?: boolean;
  bodyType?: string;
  exteriorColor?: string;
  sellerType?: SellerType;
  sort?: "price-asc" | "price-desc" | "newest" | "emi-asc" | "discount-desc" | "curated";
};

export function filterCars(list: Car[], f: CarFilters): Car[] {
  let out = [...list];
  if (f.query) {
    const qq = f.query.toLowerCase();
    out = out.filter((c) =>
      `${c.brand} ${c.model} ${c.variant} ${c.city} ${c.fuel}`.toLowerCase().includes(qq)
    );
  }
  if (f.brand) out = out.filter((c) => c.brand === f.brand);
  if (f.model) out = out.filter((c) => c.model === f.model);
  if (f.variant) out = out.filter((c) => c.variant === f.variant);
  if (f.minPrice != null) {
    const min = f.minPrice;
    out = out.filter((c) => c.price >= min);
  }
  if (f.maxPrice != null) {
    const max = f.maxPrice;
    out = out.filter((c) => c.price <= max);
  }
  if (f.maxEmi != null) {
    const emi = f.maxEmi;
    out = out.filter((c) => c.estimatedEmiMonthly <= emi);
  }
  if (f.minDiscount != null) {
    const d = f.minDiscount;
    out = out.filter((c) => c.discountPercent >= d);
  }
  if (f.fuel) out = out.filter((c) => c.fuel === f.fuel);
  if (f.transmission) out = out.filter((c) => c.transmission === f.transmission);
  if (f.minYear != null) {
    const y = f.minYear;
    out = out.filter((c) => c.year >= y);
  }
  if (f.maxYear != null) {
    const y = f.maxYear;
    out = out.filter((c) => c.year <= y);
  }
  if (f.maxOwners != null) {
    const o = f.maxOwners;
    out = out.filter((c) => c.owners <= o);
  }
  if (f.city) {
    const city = f.city;
    out = out.filter((c) => c.city.toLowerCase() === city.toLowerCase());
  }
  if (f.certifiedOnly) out = out.filter((c) => c.certified);
  if (f.isNew === true) out = out.filter((c) => c.isNew);
  if (f.isNew === false) out = out.filter((c) => !c.isNew);
  if (f.bodyType) out = out.filter((c) => c.bodyType === f.bodyType);
  if (f.exteriorColor) out = out.filter((c) => c.exteriorColor === f.exteriorColor);
  if (f.sellerType) out = out.filter((c) => c.sellerType === f.sellerType);
  if (f.sort === "price-asc") out.sort((a, b) => a.price - b.price);
  else if (f.sort === "price-desc") out.sort((a, b) => b.price - a.price);
  else if (f.sort === "newest") out.sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1));
  else if (f.sort === "emi-asc") out.sort((a, b) => a.estimatedEmiMonthly - b.estimatedEmiMonthly);
  else if (f.sort === "discount-desc") out.sort((a, b) => b.discountPercent - a.discountPercent);
  else if (f.sort === "curated") {
    /* preserve input order (e.g. shuffled explore catalog) */
  }
  return out;
}
