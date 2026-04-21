import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { formatINR } from "@/lib/utils";

const API_BASE_URL = (process.env.NEXT_PUBLIC_AUTOLOKATE_API_BASE_URL ??
  "https://autolokate-api-staging-2j5tqz76xa-el.a.run.app").replace(/\/$/, "");

export type ModelRow = {
  slug?: string;
  name?: string;
  brand?: { name?: string; slug?: string };
  brand_slug?: string;
  brand_name?: string;
  model_name?: string;
  body_type?: string;
  fuel_types?: string[];
  fuel_type?: string;
  min_price?: number | string;
  max_price?: number | string;
  starting_price?: number | string;
  hero_image_url?: string;
  [key: string]: unknown;
};

export type VariantRow = {
  id?: string;
  slug?: string;
  variant_name?: string;
  transmission?: string;
  fuel_type?: string;
  ex_showroom_price?: number | string;
  purchase_price?: number | string;
  min_price?: number | string;
  max_price?: number | string;
  [key: string]: unknown;
};

export type ModelDetails = {
  description?: string;
  body_type?: string;
  fuel_type?: string;
  fuel_types?: string[];
  min_price?: number | string;
  max_price?: number | string;
  starting_price?: number | string;
  brand_name?: string;
  model_name?: string;
  name?: string;
  brand?: { name?: string; slug?: string };
  [key: string]: unknown;
};

export type ModelDetailPayload = { listing: ModelRow; details: ModelDetails | null; variants: VariantRow[] };

export function toPrice(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function pickDisplayFields(
  payload: Record<string, unknown>,
  blocked: string[]
): Array<{ key: string; label: string; value: string }> {
  const blockedSet = new Set(blocked);
  return Object.entries(payload)
    .filter(([key]) => !blockedSet.has(key))
    .map(([key, value]) => ({ key, label: humanizeKey(key), value: toDisplayValue(value) }))
    .filter((row): row is { key: string; label: string; value: string } => Boolean(row.value));
}

export function buildModelSeo(payload: ModelDetailPayload) {
  const { listing, details } = payload;
  const brand = String(details?.brand_name ?? listing.brand_name ?? "Brand");
  const model = String(details?.model_name ?? listing.model_name ?? "Model");
  const price = toPrice(details?.starting_price ?? details?.min_price ?? listing.starting_price ?? listing.min_price);
  const brandSlug = String(listing.brand_slug ?? "").trim();
  const modelSlug = String(listing.slug ?? "").trim();
  const canonicalPath =
    brandSlug && modelSlug
      ? `/cars/${encodeURIComponent(brandSlug)}/${encodeURIComponent(modelSlug)}`
      : `/cars/${encodeURIComponent(modelSlug || model.toLowerCase().replace(/\s+/g, "-"))}`;
  const canonical = `${SITE_URL}${canonicalPath}`;
  const title = `${brand} ${model} price, specs and variants | ${SITE_NAME}`;
  const description = details?.description
    ? String(details.description)
    : `${brand} ${model} with ${String(
        details?.fuel_type ??
          (Array.isArray(details?.fuel_types) && details?.fuel_types.length ? details?.fuel_types.join(", ") : undefined) ??
          listing.fuel_type ??
          (Array.isArray(listing.fuel_types) && listing.fuel_types.length ? listing.fuel_types.join(", ") : "multiple fuel")
      )} options and ${String(
        details?.body_type ?? listing.body_type ?? "body styles"
      )}. ${price ? `Starting from ${formatINR(price)}.` : ""}`.trim();
  return { brand, model, title, description, canonical, canonicalPath };
}

export async function loadModelByBrandAndSlug(brandSlug: string, modelSlug: string): Promise<ModelDetailPayload | null> {
  const safeBrand = brandSlug.trim();
  const safeModel = modelSlug.trim();
  if (!safeBrand || !safeModel) return null;
  const [modelsResponse, detailsResponse, variantsResponse] = await Promise.all([
    fetch(`${API_BASE_URL}/v1/catalogue/brands/${encodeURIComponent(safeBrand)}/models`, { next: { revalidate: 60 } }).catch(
      () => null
    ),
    fetch(`${API_BASE_URL}/v1/catalogue/brands/${encodeURIComponent(safeBrand)}/models/${encodeURIComponent(safeModel)}`, {
      next: { revalidate: 60 },
    }).catch(() => null),
    fetch(
      `${API_BASE_URL}/v1/catalogue/brands/${encodeURIComponent(safeBrand)}/models/${encodeURIComponent(safeModel)}/variants`,
      { next: { revalidate: 60 } }
    ).catch(() => null),
  ]);
  if (!modelsResponse || !modelsResponse.ok) return null;
  const modelsJson = (await modelsResponse.json().catch(() => null)) as { data?: unknown[] } | null;
  const rows = (Array.isArray(modelsJson?.data) ? modelsJson.data : []).map(normalizeModelRow);
  const listing = rows.find((item) => String(item.slug ?? "").toLowerCase() === safeModel.toLowerCase()) ?? null;
  if (!listing) return null;
  const detailsJson =
    detailsResponse && detailsResponse.ok
      ? ((await detailsResponse.json().catch(() => null)) as { data?: ModelDetails } | null)
      : null;
  const variantsJson =
    variantsResponse && variantsResponse.ok
      ? ((await variantsResponse.json().catch(() => null)) as { data?: VariantRow[] } | null)
      : null;
  const baseVariants = (Array.isArray(variantsJson?.data) ? variantsJson.data : []).map(normalizeVariantRow).slice(0, 8);
  const variantDetails = await Promise.all(
    baseVariants.map(async (variant) => {
      if (!variant.slug) return variant;
      const response = await fetch(
        `${API_BASE_URL}/v1/catalogue/brands/${encodeURIComponent(safeBrand)}/models/${encodeURIComponent(safeModel)}/variants/${encodeURIComponent(String(variant.slug))}`,
        { next: { revalidate: 60 } }
      ).catch(() => null);
      if (!response || !response.ok) return variant;
      const variantJson = (await response.json().catch(() => null)) as { data?: unknown } | null;
      return { ...variant, ...normalizeVariantRow(variantJson?.data) };
    })
  );
  return {
    listing,
    details: detailsJson?.data ? normalizeModelRow(detailsJson.data) : null,
    variants: variantDetails,
  };
}

export async function loadModelBySlug(slug: string): Promise<ModelDetailPayload | null> {
  const modelsResponse = await fetch(`${API_BASE_URL}/v1/catalogue/models`, {
    next: { revalidate: 60 },
  });
  const modelsJson = (await modelsResponse.json().catch(() => null)) as { data?: ModelRow[] } | null;
  const rows = (Array.isArray(modelsJson?.data) ? modelsJson.data : []).map(normalizeModelRow);
  const listing =
    rows.find((item) => String(item.slug ?? "").toLowerCase() === slug.toLowerCase()) ?? (await lookupModelFromSearch(slug));
  if (!listing) return null;
  const brandSlug = String(listing.brand_slug ?? "").trim();
  const modelSlug = String(listing.slug ?? "").trim();
  const maybeHydrated =
    !String(listing.hero_image_url ?? "").trim() && brandSlug && modelSlug
      ? await hydrateModelFromBrandModels(brandSlug, modelSlug)
      : null;
  const resolvedListing = maybeHydrated ? { ...listing, ...maybeHydrated } : listing;
  if (!brandSlug || !modelSlug) {
    return { listing: resolvedListing, details: null, variants: [] };
  }
  const nested = await loadModelByBrandAndSlug(brandSlug, modelSlug);
  if (!nested) return { listing: resolvedListing, details: null, variants: [] };
  return { ...nested, listing: { ...resolvedListing, ...nested.listing } };
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function toDisplayValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value.toLocaleString("en-IN");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") {
    const v = value.trim();
    return v ? v : null;
  }
  if (Array.isArray(value)) {
    const items = value
      .map((item) => (typeof item === "string" || typeof item === "number" ? String(item).trim() : ""))
      .filter(Boolean);
    return items.length ? items.join(", ") : null;
  }
  return null;
}

function normalizeModelRow(payload: unknown): ModelRow {
  if (!payload || typeof payload !== "object") return {};
  const row = payload as Record<string, unknown>;
  const brand = (row.brand as { name?: string; slug?: string } | undefined) ?? {};
  const fuelTypes = Array.isArray(row.fuel_types) ? (row.fuel_types as string[]) : [];
  return {
    ...(row as ModelRow),
    brand_name: (row.brand_name as string | undefined) ?? brand.name,
    brand_slug: (row.brand_slug as string | undefined) ?? brand.slug,
    model_name: (row.model_name as string | undefined) ?? (row.name as string | undefined),
    fuel_type: (row.fuel_type as string | undefined) ?? fuelTypes[0],
    starting_price: (row.starting_price as number | string | undefined) ?? (row.min_price as number | string | undefined),
    min_price: (row.min_price as number | string | undefined) ?? (row.starting_price as number | string | undefined),
    max_price: row.max_price as number | string | undefined,
    hero_image_url:
      (row.hero_image_url as string | undefined) ??
      (row.image_url as string | undefined) ??
      (row.thumbnail_url as string | undefined),
  };
}

function normalizeVariantRow(payload: unknown): VariantRow {
  if (!payload || typeof payload !== "object") return {};
  const row = payload as Record<string, unknown>;
  return {
    ...(row as VariantRow),
    variant_name: (row.variant_name as string | undefined) ?? (row.name as string | undefined),
    fuel_type: (row.fuel_type as string | undefined) ?? (row.fuel as string | undefined),
    ex_showroom_price:
      (row.ex_showroom_price as number | string | undefined) ??
      (row.purchase_price as number | string | undefined) ??
      (row.price as number | string | undefined) ??
      (row.min_price as number | string | undefined),
    min_price:
      (row.min_price as number | string | undefined) ??
      (row.ex_showroom_price as number | string | undefined) ??
      (row.price as number | string | undefined),
    max_price:
      (row.max_price as number | string | undefined) ??
      (row.ex_showroom_price as number | string | undefined) ??
      (row.price as number | string | undefined),
  };
}

async function lookupModelFromSearch(slug: string): Promise<ModelRow | null> {
  const q = slug.replace(/-/g, " ").trim();
  if (!q) return null;
  const response = await fetch(`${API_BASE_URL}/v1/catalogue/search?q=${encodeURIComponent(q)}`, {
    next: { revalidate: 60 },
  }).catch(() => null);
  if (!response || !response.ok) return null;
  const json = (await response.json().catch(() => null)) as
    | { data?: unknown[] | { models?: unknown[]; items?: unknown[]; results?: unknown[] } }
    | null;
  const payload = json?.data;
  let rows: unknown[] = [];
  if (Array.isArray(payload)) rows = payload;
  else if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    if (Array.isArray(p.models)) rows = p.models;
    else if (Array.isArray(p.items)) rows = p.items;
    else if (Array.isArray(p.results)) rows = p.results;
  }
  const normalized = rows.map(normalizeModelRow);
  const wanted = slug.toLowerCase();
  const exact = normalized.find((r) => String(r.slug ?? "").toLowerCase() === wanted);
  if (exact) return exact;
  return normalized.find((r) => String(r.model_name ?? "").toLowerCase().replace(/\s+/g, "-") === wanted) ?? null;
}

async function hydrateModelFromBrandModels(brandSlug: string, modelSlug: string): Promise<ModelRow | null> {
  if (!brandSlug || !modelSlug) return null;
  const response = await fetch(
    `${API_BASE_URL}/v1/catalogue/brands/${encodeURIComponent(brandSlug)}/models`,
    { next: { revalidate: 60 } }
  ).catch(() => null);
  if (!response || !response.ok) return null;
  const json = (await response.json().catch(() => null)) as { data?: unknown[] } | null;
  const rows = (Array.isArray(json?.data) ? json.data : []).map(normalizeModelRow);
  const wanted = modelSlug.toLowerCase();
  return rows.find((item) => String(item.slug ?? "").toLowerCase() === wanted) ?? null;
}
