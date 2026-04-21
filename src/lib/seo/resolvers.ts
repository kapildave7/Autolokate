import { brands } from "@/data";
import { cars } from "@/data/cars";
import { slugifyPart } from "./slugs";

const uniqueCities = [...new Set(cars.map((c) => c.city))];

/** Map common SEO aliases to dataset city labels. */
const CITY_ALIASES: Record<string, string> = {
  bangalore: "Bengaluru",
  bengaluru: "Bengaluru",
  delhi: "Delhi",
  mumbai: "Mumbai",
  chennai: "Chennai",
  kolkata: "Kolkata",
  hyderabad: "Hyderabad",
  pune: "Pune",
  ahmedabad: "Ahmedabad",
  jaipur: "Jaipur",
  indore: "Indore",
  kochi: "Kochi",
  chandigarh: "Chandigarh",
  gurugram: "Gurugram",
  gurgaon: "Gurugram",
  "new-delhi": "New Delhi",
};

export function resolveCityFromSlug(slug: string): string | null {
  const key = slug.toLowerCase();
  if (CITY_ALIASES[key]) {
    const target = CITY_ALIASES[key];
    if (uniqueCities.includes(target)) return target;
  }
  const hit = uniqueCities.find((c) => slugifyPart(c) === key);
  return hit ?? null;
}

export function cityToSlug(city: string): string {
  const lower = city.toLowerCase();
  if (lower === "bengaluru") return "bangalore";
  return slugifyPart(city);
}

export function resolveBrandFromSlug(slug: string): string | null {
  const key = slug.toLowerCase();
  const hit = brands.find((b) => slugifyPart(b) === key);
  return hit ?? null;
}

export function resolveModelFromSlug(brand: string, slug: string): string | null {
  const key = slug.toLowerCase();
  const models = [...new Set(cars.filter((c) => c.brand === brand).map((c) => c.model))];
  const hit = models.find((m) => slugifyPart(m) === key);
  return hit ?? null;
}

export function resolveVariantFromSlug(brand: string, model: string, slug: string): string | null {
  const key = slug.toLowerCase();
  const variants = [
    ...new Set(cars.filter((c) => c.brand === brand && c.model === model).map((c) => c.variant)),
  ];
  const hit = variants.find((v) => slugifyPart(v) === key);
  return hit ?? null;
}
