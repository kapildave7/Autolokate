"use client";

import { apiRequest } from "@/lib/client/api-client";

export type SeoItem = Record<string, unknown> & { id?: string };
export type SeoListResult = {
  items: SeoItem[];
  total: number;
};

function withId(path: string, id: string): string {
  return `${path}/${encodeURIComponent(id)}`;
}

type ListEnvelope =
  | SeoItem[]
  | {
      success?: boolean;
      data?: SeoItem[];
      meta?: { total?: number };
    }
  | {
      data?: SeoItem[];
      meta?: { total?: number };
    };

type ObjectEnvelope =
  | Record<string, unknown>
  | {
      success?: boolean;
      data?: Record<string, unknown>;
    };

function unwrapList(payload: ListEnvelope): SeoListResult {
  if (Array.isArray(payload)) {
    return { items: payload, total: payload.length };
  }
  const items = payload.data ?? [];
  const total = typeof payload.meta?.total === "number" ? payload.meta.total : items.length;
  return { items, total };
}

export async function listSeoMetadata(): Promise<SeoListResult> {
  const payload = await apiRequest<ListEnvelope>("/v1/admin/seo/metadata", { method: "GET", auth: true });
  return unwrapList(payload);
}

export async function upsertSeoMetadata(body: Record<string, unknown>): Promise<void> {
  await apiRequest("/v1/admin/seo/metadata", { method: "POST", auth: true, body });
}

export async function deleteSeoMetadata(id: string): Promise<void> {
  await apiRequest(withId("/v1/admin/seo/metadata", id), { method: "DELETE", auth: true });
}

export async function listSeoFaqs(): Promise<SeoListResult> {
  const payload = await apiRequest<ListEnvelope>("/v1/admin/seo/faqs", { method: "GET", auth: true });
  return unwrapList(payload);
}

export async function createSeoFaq(body: Record<string, unknown>): Promise<void> {
  await apiRequest("/v1/admin/seo/faqs", { method: "POST", auth: true, body });
}

export async function updateSeoFaq(id: string, body: Record<string, unknown>): Promise<void> {
  await apiRequest(withId("/v1/admin/seo/faqs", id), { method: "PATCH", auth: true, body });
}

export async function deleteSeoFaq(id: string): Promise<void> {
  await apiRequest(withId("/v1/admin/seo/faqs", id), { method: "DELETE", auth: true });
}

export async function listSeoRedirects(): Promise<SeoListResult> {
  const payload = await apiRequest<ListEnvelope>("/v1/admin/seo/redirects", { method: "GET", auth: true });
  return unwrapList(payload);
}

export async function createSeoRedirect(body: Record<string, unknown>): Promise<void> {
  await apiRequest("/v1/admin/seo/redirects", { method: "POST", auth: true, body });
}

export async function deleteSeoRedirect(id: string): Promise<void> {
  await apiRequest(withId("/v1/admin/seo/redirects", id), { method: "DELETE", auth: true });
}

export async function getSeoHealth(): Promise<Record<string, unknown>> {
  const payload = await apiRequest<ObjectEnvelope>("/v1/admin/seo/health", {
    method: "GET",
    auth: true,
  });
  if ("data" in payload && payload.data) return payload.data;
  return payload;
}
