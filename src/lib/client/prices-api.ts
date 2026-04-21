"use client";

import { apiRequest } from "@/lib/client/api-client";

type Envelope<T> = { success?: boolean; data?: T };

function unbox<T>(res: Envelope<T> | T): T {
  if (res && typeof res === "object" && "data" in (res as Envelope<T>)) {
    return ((res as Envelope<T>).data ?? null) as T;
  }
  return res as T;
}

function readArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return [];
}

export type EmiQuote = {
  principal: number;
  rate: number;
  tenure_months: number;
  monthly_emi: number;
  total_interest: number;
  total_payable: number;
  schedule?: Array<Record<string, unknown>>;
};

export type TcoBreakdown = {
  variant_id: string;
  city: string;
  years: number;
  km_per_year: number;
  purchase_price: number;
  fuel_cost: number;
  insurance_cost: number;
  maintenance_cost: number;
  depreciation: number;
  total_cost: number;
  cost_per_km: number;
};

export type ResaleEstimate = {
  variant_id: string;
  year: number;
  estimated_value: number;
  depreciation_pct: number;
};

/**
 * Current fuel prices for a city. API requires `city` (query).
 * Optional: `fuel_type` (e.g. petrol, diesel, cng).
 */
export async function getFuelPrices(city: string, params?: { fuel_type?: string }): Promise<unknown[]> {
  const q = new URLSearchParams({ city });
  if (params?.fuel_type) q.set("fuel_type", params.fuel_type);
  const res = await apiRequest<Envelope<unknown>>(`/v1/prices/fuel?${q.toString()}`);
  return readArray(unbox(res));
}

/**
 * Fuel price history. Requires `city`; optional window and fuel filter — pass through as query keys the API accepts.
 */
export async function getFuelPriceHistory(
  city: string,
  params?: { from?: string; to?: string; fuel_type?: string }
): Promise<unknown[]> {
  const q = new URLSearchParams({ city });
  if (params?.from) q.set("from", params.from);
  if (params?.to) q.set("to", params.to);
  if (params?.fuel_type) q.set("fuel_type", params.fuel_type);
  const res = await apiRequest<Envelope<unknown>>(`/v1/prices/fuel/history?${q.toString()}`);
  return readArray(unbox(res));
}

/** EV subsidies — `GET /v1/prices/ev-subsidies` with no query params (API rejects unknown keys e.g. `model`). */
export async function getEvSubsidies(): Promise<unknown[]> {
  const res = await apiRequest<Envelope<unknown>>("/v1/prices/ev-subsidies");
  return readArray(unbox(res));
}

/** Total cost of ownership — requires variant UUID and city. */
export async function getTco(
  variantId: string,
  city: string,
  options?: { signal?: AbortSignal }
): Promise<TcoBreakdown> {
  const q = new URLSearchParams({ city });
  const res = await apiRequest<Envelope<TcoBreakdown>>(
    `/v1/prices/tco/${encodeURIComponent(variantId)}?${q.toString()}`,
    { signal: options?.signal }
  );
  return unbox(res) as TcoBreakdown;
}

/**
 * EMI quote. Constraints: principal ≥ 10000; rate 0.1–30; tenure_months 1–120.
 */
export async function getEmiQuote(params: {
  principal: number;
  rate: number;
  tenure_months: number;
}): Promise<EmiQuote> {
  const q = new URLSearchParams({
    principal: String(params.principal),
    rate: String(params.rate),
    tenure_months: String(params.tenure_months),
  });
  const res = await apiRequest<Envelope<EmiQuote>>(`/v1/prices/emi?${q.toString()}`);
  return unbox(res) as EmiQuote;
}

/** Resale estimate for a variant at a given ownership year index. */
export async function getResaleEstimate(variantId: string, params: { year: number }): Promise<ResaleEstimate> {
  const q = new URLSearchParams({ year: String(params.year) });
  const res = await apiRequest<Envelope<ResaleEstimate>>(
    `/v1/prices/resale/${encodeURIComponent(variantId)}?${q.toString()}`
  );
  return unbox(res) as ResaleEstimate;
}
