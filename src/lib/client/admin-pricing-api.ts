"use client";

import { apiRequest } from "@/lib/client/api-client";

export type PricingItem = Record<string, unknown> & { id?: string };
export type PricingListResult = { items: PricingItem[]; total: number };

type PricingEnvelope =
  | PricingItem[]
  | { success?: boolean; data?: PricingItem[]; meta?: { total?: number } }
  | { data?: PricingItem[]; meta?: { total?: number } };

function withId(path: string, id: string): string {
  return `${path}/${encodeURIComponent(id)}`;
}

function unwrapList(payload: PricingEnvelope): PricingListResult {
  if (Array.isArray(payload)) return { items: payload, total: payload.length };
  const items = payload.data ?? [];
  return {
    items,
    total: typeof payload.meta?.total === "number" ? payload.meta.total : items.length,
  };
}

export async function listPricingConfigs(): Promise<PricingListResult> {
  const payload = await apiRequest<PricingEnvelope>("/v1/admin/pricing", { method: "GET", auth: true });
  return unwrapList(payload);
}

export async function createPricingConfig(body: Record<string, unknown>): Promise<void> {
  await apiRequest("/v1/admin/pricing", { method: "POST", auth: true, body });
}

export async function updatePricingConfig(id: string, body: Record<string, unknown>): Promise<void> {
  await apiRequest(withId("/v1/admin/pricing", id), { method: "PATCH", auth: true, body });
}

export async function deactivatePricingConfig(id: string): Promise<void> {
  await apiRequest(withId("/v1/admin/pricing", id), { method: "DELETE", auth: true });
}
