import { slugifyPart } from "./slugs";
import type { Bike } from "@/data/types";

export function bikeSlug(bike: Bike): string {
  return `${slugifyPart(bike.brand)}-${slugifyPart(bike.model)}-${bike.id}`;
}

export function bikePath(bike: Bike): string {
  return `/bikes/${bikeSlug(bike)}`;
}

export function bikeIdFromSlug(slug: string): string | null {
  const m = slug.match(/-(bike-\d+)$/i);
  return m ? m[1].toLowerCase() : null;
}

