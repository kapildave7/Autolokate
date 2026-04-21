"use client";

import { apiRequest } from "@/lib/client/api-client";

type Envelope<T> = { success?: boolean; data?: T; meta?: Record<string, unknown> };

function unbox<T>(res: Envelope<T> | T): T {
  if (res && typeof res === "object" && "data" in (res as Envelope<T>)) {
    return ((res as Envelope<T>).data ?? null) as T;
  }
  return res as T;
}

export type TaxonomySpecRow = {
  id?: string;
  canonical_key: string;
  display_name: string;
  spec_group: string;
  vehicle_categories?: string[];
  data_type: string;
  unit: string | null;
  description?: string | null;
  sort_order: number;
  is_active?: boolean;
};

export type TaxonomyFeatureRow = {
  id?: string;
  canonical_key: string;
  display_name: string;
  feature_group: string;
  vehicle_categories?: string[];
  value_type: string;
  description?: string | null;
  sort_order: number;
  is_active?: boolean;
};

export type TaxonomyBundle = {
  specs: TaxonomySpecRow[];
  features: TaxonomyFeatureRow[];
};

function readObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  return value as Record<string, unknown>;
}

function normalizeSpec(raw: unknown): TaxonomySpecRow {
  const row = readObject(raw);
  return {
    id: row.id as string | undefined,
    canonical_key: String(row.canonical_key ?? ""),
    display_name: String(row.display_name ?? row.canonical_key ?? ""),
    spec_group: String(row.spec_group ?? "other"),
    vehicle_categories: Array.isArray(row.vehicle_categories) ? (row.vehicle_categories as string[]) : undefined,
    data_type: String(row.data_type ?? "text"),
    unit: row.unit === null || row.unit === undefined ? null : String(row.unit),
    description: row.description as string | null | undefined,
    sort_order: typeof row.sort_order === "number" ? row.sort_order : Number(row.sort_order) || 0,
    is_active: row.is_active as boolean | undefined,
  };
}

function normalizeFeature(raw: unknown): TaxonomyFeatureRow {
  const row = readObject(raw);
  return {
    id: row.id as string | undefined,
    canonical_key: String(row.canonical_key ?? ""),
    display_name: String(row.display_name ?? row.canonical_key ?? ""),
    feature_group: String(row.feature_group ?? "other"),
    vehicle_categories: Array.isArray(row.vehicle_categories) ? (row.vehicle_categories as string[]) : undefined,
    value_type: String(row.value_type ?? "boolean"),
    description: row.description as string | null | undefined,
    sort_order: typeof row.sort_order === "number" ? row.sort_order : Number(row.sort_order) || 0,
    is_active: row.is_active as boolean | undefined,
  };
}

/** `/v1/taxonomy` → `{ specs, features }` on `data`. */
function parseTaxonomyBundle(payload: unknown): TaxonomyBundle {
  const root = readObject(unbox(payload));
  const specsRaw = root.specs;
  const featuresRaw = root.features;
  const specs = Array.isArray(specsRaw) ? specsRaw.map(normalizeSpec) : [];
  const features = Array.isArray(featuresRaw) ? featuresRaw.map(normalizeFeature) : [];
  return { specs, features };
}

/** `/v1/taxonomy/specs` and `/features` may return `{ data: rows }` or nested `{ data: { data: rows } }`. */
function parseSpecListPayload(payload: unknown): TaxonomySpecRow[] {
  const root = readObject(unbox(payload));
  if (Array.isArray(root.specs)) return root.specs.map(normalizeSpec);
  let rows: unknown = root.data;
  if (rows && typeof rows === "object" && !Array.isArray(rows) && Array.isArray((rows as Record<string, unknown>).data)) {
    rows = (rows as Record<string, unknown>).data;
  }
  if (Array.isArray(rows)) return rows.map(normalizeSpec);
  return [];
}

function parseFeatureListPayload(payload: unknown): TaxonomyFeatureRow[] {
  const root = readObject(unbox(payload));
  if (Array.isArray(root.features)) return root.features.map(normalizeFeature);
  let rows: unknown = root.data;
  if (rows && typeof rows === "object" && !Array.isArray(rows) && Array.isArray((rows as Record<string, unknown>).data)) {
    rows = (rows as Record<string, unknown>).data;
  }
  if (Array.isArray(rows)) return rows.map(normalizeFeature);
  return [];
}

function categoryQuery(category?: string): string {
  return category ? `?category=${encodeURIComponent(category)}` : "";
}

/**
 * Full taxonomy for a vehicle category (specs + features).
 * `GET /v1/taxonomy?category=car`
 */
export async function getTaxonomy(params?: { category?: string }): Promise<TaxonomyBundle> {
  const q = categoryQuery(params?.category);
  const res = await apiRequest<Envelope<unknown>>(`/v1/taxonomy${q}`);
  return parseTaxonomyBundle(res);
}

/**
 * Canonical spec definitions only.
 * `GET /v1/taxonomy/specs?category=car`
 */
export async function getTaxonomySpecs(params?: { category?: string }): Promise<TaxonomySpecRow[]> {
  const q = categoryQuery(params?.category);
  const res = await apiRequest<Envelope<unknown>>(`/v1/taxonomy/specs${q}`);
  return parseSpecListPayload(res);
}

/**
 * Canonical feature definitions only.
 * `GET /v1/taxonomy/features?category=car`
 */
export async function getTaxonomyFeatures(params?: { category?: string }): Promise<TaxonomyFeatureRow[]> {
  const q = categoryQuery(params?.category);
  const res = await apiRequest<Envelope<unknown>>(`/v1/taxonomy/features${q}`);
  return parseFeatureListPayload(res);
}
