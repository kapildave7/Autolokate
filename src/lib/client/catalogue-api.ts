"use client";

import { apiRequest } from "@/lib/client/api-client";

type Envelope<T> = { success?: boolean; data?: T; meta?: Record<string, unknown> };

function unbox<T>(res: Envelope<T> | T): T {
  if (res && typeof res === "object" && "data" in (res as Envelope<T>)) {
    return ((res as Envelope<T>).data ?? null) as T;
  }
  return res as T;
}

function readArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  if (Array.isArray(record.items)) return record.items as T[];
  if (Array.isArray(record.results)) return record.results as T[];
  if (Array.isArray(record.rows)) return record.rows as T[];
  return [];
}

function readObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  return value as Record<string, unknown>;
}

function sanitizeParams(
  params: Record<string, string> | undefined,
  blockedKeys: string[]
): Record<string, string> | undefined {
  if (!params) return undefined;
  const blocked = new Set(blockedKeys.map((key) => key.toLowerCase()));
  const out = Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
    if (blocked.has(key.toLowerCase())) return acc;
    acc[key] = value;
    return acc;
  }, {});
  return Object.keys(out).length ? out : undefined;
}

function normalizeBrand(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const row = raw as Record<string, unknown>;
  const name = row.name ?? row.brand_name ?? row.title;
  const slug = row.slug ?? row.brand_slug;
  return {
    ...row,
    name,
    brand_name: name,
    slug,
    brand_slug: slug,
  };
}

function normalizeModel(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const row = raw as Record<string, unknown>;
  const brand = (row.brand as Record<string, unknown> | undefined) ?? {};
  const brandName = row.brand_name ?? brand.name;
  const brandSlug = row.brand_slug ?? brand.slug;
  const modelName = row.model_name ?? row.name;
  const fuelTypes = Array.isArray(row.fuel_types) ? (row.fuel_types as unknown[]) : [];
  const primaryFuel = row.fuel_type ?? (fuelTypes[0] as string | undefined);
  const minPrice = row.starting_price ?? row.min_price;
  const maxPrice = row.max_price ?? row.ending_price;
  const heroImage = row.hero_image_url ?? row.image_url ?? row.thumbnail_url;
  return {
    ...row,
    brand,
    brand_name: brandName,
    brand_slug: brandSlug,
    model_name: modelName,
    name: row.name ?? modelName,
    fuel_type: primaryFuel,
    fuel_types: fuelTypes,
    starting_price: minPrice,
    min_price: minPrice,
    max_price: maxPrice,
    hero_image_url: heroImage,
  };
}

function normalizeVariant(raw: unknown): Record<string, unknown> {
  const row = readObject(raw);
  const brand = (row.brand as Record<string, unknown> | undefined) ?? {};
  const model = (row.model as Record<string, unknown> | undefined) ?? {};
  const price = (row.price as Record<string, unknown> | undefined) ?? {};
  const exShowroom = row.ex_showroom_price ?? row.price ?? row.min_price ?? price.ex_showroom_price;
  return {
    ...row,
    variant_name: row.variant_name ?? row.name,
    brand_slug: row.brand_slug ?? brand.slug,
    brand_name: row.brand_name ?? brand.name,
    model_name: row.model_name ?? model.name,
    model_slug: row.model_slug ?? model.slug,
    fuel_type: row.fuel_type ?? row.fuel,
    ex_showroom_price: exShowroom,
    min_price: row.min_price ?? exShowroom,
    max_price: row.max_price ?? exShowroom,
  };
}

export async function getBrands() {
  // Backend currently rejects vehicle_category despite docs listing it as optional.
  const res = await apiRequest<Envelope<unknown[]>>("/v1/catalogue/brands");
  const rows = readArray<unknown>(unbox(res));
  return rows.map(normalizeBrand);
}

export async function getTrending() {
  const res = await apiRequest<Envelope<unknown[]>>("/v1/catalogue/trending");
  const rows = readArray<unknown>(unbox(res));
  return rows.map(normalizeModel);
}

export async function searchCatalogue(query: string) {
  const res = await apiRequest<Envelope<unknown[] | Record<string, unknown>>>(
    `/v1/catalogue/search?q=${encodeURIComponent(query)}`
  );
  const payload = unbox(res);
  if (Array.isArray(payload)) return payload.map(normalizeModel);
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    return [
      ...readArray<unknown>(p.models).map(normalizeModel),
      ...readArray<unknown>(p.variants).map(normalizeVariant),
      ...readArray<unknown>(p.brands).map(normalizeBrand),
    ];
  }
  return [];
}

export async function getBrandDetails(brandSlug: string) {
  const res = await apiRequest<Envelope<unknown>>(`/v1/catalogue/brands/${encodeURIComponent(brandSlug)}`);
  return normalizeBrand(unbox(res));
}

export async function getBrandModels(brandSlug: string, params?: Record<string, string>) {
  const q = new URLSearchParams(sanitizeParams(params, ["brand", "vehicle_category"]) ?? {});
  const res = await apiRequest<Envelope<unknown[]>>(
    `/v1/catalogue/brands/${encodeURIComponent(brandSlug)}/models${q.toString() ? `?${q.toString()}` : ""}`
  );
  const rows = readArray<unknown>(unbox(res));
  return rows.map(normalizeModel);
}

export async function getModels(params?: Record<string, string>) {
  // Live API rejects `brand` query here; brand filtering should use /brands/{brandSlug}/models.
  const q = new URLSearchParams(sanitizeParams(params, ["brand", "vehicle_category"]) ?? {});
  const res = await apiRequest<Envelope<unknown[]>>(`/v1/catalogue/models${q.toString() ? `?${q.toString()}` : ""}`);
  const rows = readArray<unknown>(unbox(res));
  return rows.map(normalizeModel);
}

export async function getModelDetails(brandSlug: string, modelSlug: string) {
  const res = await apiRequest<Envelope<unknown>>(
    `/v1/catalogue/brands/${encodeURIComponent(brandSlug)}/models/${encodeURIComponent(modelSlug)}`
  );
  return normalizeModel(unbox(res));
}

export async function getModelVariants(brandSlug: string, modelSlug: string) {
  const res = await apiRequest<Envelope<unknown[]>>(
    `/v1/catalogue/brands/${encodeURIComponent(brandSlug)}/models/${encodeURIComponent(modelSlug)}/variants`
  );
  const rows = readArray<Record<string, unknown>>(unbox(res));
  return rows.map(normalizeVariant);
}

export async function getVariantDetails(brandSlug: string, modelSlug: string, variantSlug: string) {
  const res = await apiRequest<Envelope<unknown>>(
    `/v1/catalogue/brands/${encodeURIComponent(brandSlug)}/models/${encodeURIComponent(modelSlug)}/variants/${encodeURIComponent(variantSlug)}`
  );
  return normalizeVariant(unbox(res));
}

export async function getVariantPrice(brandSlug: string, modelSlug: string, variantSlug: string, city: string) {
  // Live API currently rejects `city` query param (BAD_REQUEST), so keep endpoint unfiltered.
  void city;
  const res = await apiRequest<Envelope<unknown>>(
    `/v1/catalogue/brands/${encodeURIComponent(brandSlug)}/models/${encodeURIComponent(modelSlug)}/variants/${encodeURIComponent(variantSlug)}/price`
  );
  return normalizeVariant(unbox(res));
}

export async function compareVariants(variantIds: string[]) {
  // Live API expects `ids` as comma-separated values, not `variants` or `ids[]`.
  const safeIds = variantIds.map((id) => encodeURIComponent(id)).join(",");
  const res = await apiRequest<Envelope<unknown>>(`/v1/catalogue/compare?ids=${safeIds}`);
  const payload = unbox(res);
  if (Array.isArray(payload)) return payload.map(normalizeVariant);
  const maybe = readObject(payload);
  if (Array.isArray(maybe.items)) return (maybe.items as unknown[]).map(normalizeVariant);
  if (Array.isArray(maybe.variants)) return (maybe.variants as unknown[]).map(normalizeVariant);
  return maybe;
}

/** Normalized list of variants for compare UI (handles array or wrapped payloads). */
export async function compareVariantsList(variantIds: string[]): Promise<Record<string, unknown>[]> {
  const raw = await compareVariants(variantIds);
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.items)) return (o.items as unknown[]).map((v) => normalizeVariant(v));
    if (Array.isArray(o.variants)) return (o.variants as unknown[]).map((v) => normalizeVariant(v));
    if (Array.isArray(o.data)) return (o.data as unknown[]).map((v) => normalizeVariant(v));
    const dataObj = readObject(o.data);
    if (Array.isArray(dataObj.variants)) return (dataObj.variants as unknown[]).map((v) => normalizeVariant(v));
  }
  return [];
}
