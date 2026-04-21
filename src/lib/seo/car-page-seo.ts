import type { Car } from "@/data/types";
import { SITE_NAME } from "@/lib/seo/site";
import { formatINR } from "@/lib/utils";

const TITLE_SOFT_MAX = 58;
const DESC_SOFT_MAX = 158;

function truncateWords(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

/** Page `<title>` — unique per listing, search-intent oriented (India / city / price signal). */
export function carPageTitle(car: Car): string {
  const condition = car.isNew ? "New" : "Used";
  const core = `${car.brand} ${car.model} ${car.year} ${condition} in ${car.city}`;
  const suffix = ` — Price, specs | ${SITE_NAME}`;
  const full = `${core}${suffix}`;
  if (full.length <= TITLE_SOFT_MAX + 25) return full;
  const shorter = `${car.brand} ${car.model} ${car.year} ${car.city} — ${formatINR(car.price)} | ${SITE_NAME}`;
  return shorter.length > 70 ? truncateWords(shorter, 68) : shorter;
}

/** Meta description — 150–160 chars, natural language, no stuffing. */
export function carPageMetaDescription(car: Car): string {
  const variantBit = car.variant.length < 42 ? `${car.variant}. ` : "";
  const base = `${car.brand} ${car.model} (${car.year}) in ${car.city}: listed at ${formatINR(car.price)}. ${variantBit}${car.fuel} ${car.transmission}, ${car.mileage}, ${car.bodyType.toLowerCase()}. Compare specs, inspection, and similar cars on ${SITE_NAME}.`;
  return truncateWords(base, DESC_SOFT_MAX);
}

/** Plain description for JSON-LD (can be longer than meta). */
export function carListingRichDescription(car: Car): string {
  return `${car.brand} ${car.model} ${car.variant} — ${car.year} model in ${car.city}. Listed price ${formatINR(car.price)} (${car.fuel}, ${car.transmission}, ${car.mileage}). ${car.bodyType}. ${car.owners} owner(s), ${car.kms.toLocaleString("en-IN")} km. Research specs, features, and reviews on ${SITE_NAME}.`;
}
