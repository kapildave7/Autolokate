import type { Car } from "@/data/types";
import { cars } from "@/data";
import { getModelVariants, searchCatalogue } from "@/lib/client/catalogue-api";
import { slugifyPart } from "@/lib/seo/slugs";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function readText(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function readNumber(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Preference order: explicitly flagged default/popular, then lowest price, then first row. */
export function pickDefaultCatalogueVariant(
  variants: Record<string, unknown>[]
): Record<string, unknown> | null {
  if (!Array.isArray(variants) || variants.length === 0) return null;

  const flagged = variants.find((v) => v.is_default === true || v.is_popular === true);
  if (flagged) return flagged;

  const priced = variants
    .map((v) => ({
      row: v,
      price: readNumber(v.ex_showroom_price ?? v.min_price ?? v.price) ?? Number.POSITIVE_INFINITY,
    }))
    .sort((a, b) => a.price - b.price);
  if (priced[0]?.row) return priced[0].row;

  return variants[0] ?? null;
}

function readBrandSlugFromModel(model: Record<string, unknown>): string | null {
  const direct = readText(model.brand_slug);
  if (direct) return direct;

  const brandObj = isRecord(model.brand) ? model.brand : null;
  if (brandObj) {
    const nested = readText(brandObj.slug);
    if (nested) return nested;
    const nestedName = readText(brandObj.name);
    if (nestedName) return slugifyPart(nestedName);
  }

  const brandName = readText(model.brand_name);
  return brandName ? slugifyPart(brandName) : null;
}

function readModelSlug(model: Record<string, unknown>): string | null {
  const direct = readText(model.model_slug) ?? readText(model.slug);
  if (direct) return direct;
  const modelName = readText(model.model_name) ?? readText(model.name);
  return modelName ? slugifyPart(modelName) : null;
}

/** For catalogue model cards: pick one stable default variant id for compare. */
export async function resolveCatalogueModelToVariantId(model: unknown): Promise<string | null> {
  if (!isRecord(model)) return null;
  if (typeof model.default_variant_id === "string" && model.default_variant_id.length > 8) {
    return model.default_variant_id;
  }
  const brandSlug = readBrandSlugFromModel(model);
  const modelSlug = readModelSlug(model);
  if (!brandSlug || !modelSlug) return null;

  try {
    const variants = await getModelVariants(brandSlug, modelSlug);
    const preferred = pickDefaultCatalogueVariant(variants as Record<string, unknown>[]);
    const id = preferred?.id;
    return typeof id === "string" && id.length > 8 ? id : null;
  } catch {
    return null;
  }
}

/** Best-effort: map a used listing to a catalogue variant id via search (for compare API). */
export async function resolveListingCarToVariantId(car: Car): Promise<string | null> {
  const q = `${car.brand} ${car.model} ${car.variant}`.replace(/\s+/g, " ").trim();
  if (!q) return null;
  try {
    const rows = await searchCatalogue(q);
    for (const raw of rows) {
      if (!isRecord(raw)) continue;
      const id = raw.id;
      const hasVariantName = Boolean(raw.variant_name ?? raw.name);
      if (typeof id === "string" && id.length > 8 && hasVariantName) return id;
    }
  } catch {
    return null;
  }
  return null;
}

export async function resolveCarIdToVariantId(carId: string): Promise<string | null> {
  const car = cars.find((c) => c.id === carId);
  if (!car) return null;
  return resolveListingCarToVariantId(car);
}
