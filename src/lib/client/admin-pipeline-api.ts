"use client";

import { apiRequest } from "@/lib/client/api-client";

export type PipelineItem = Record<string, unknown> & { id?: string };
export type PipelineListResult = { items: PipelineItem[]; total: number };

type ListEnvelope =
  | PipelineItem[]
  | { success?: boolean; data?: PipelineItem[]; meta?: { total?: number } }
  | { data?: PipelineItem[]; meta?: { total?: number } };

type ObjectEnvelope = Record<string, unknown> | { data?: Record<string, unknown> };
type PipelineListParams = {
  limit?: number;
  severity?: string;
  acknowledged?: boolean;
  entity_type?: string;
  entity_id?: string;
};

function unwrapList(payload: ListEnvelope): PipelineListResult {
  if (Array.isArray(payload)) return { items: payload, total: payload.length };
  const rawItems = Array.isArray(payload.data)
    ? payload.data
    : payload.data && typeof payload.data === "object"
      ? ((payload.data as Record<string, unknown>).items ??
        (payload.data as Record<string, unknown>).results ??
        (payload.data as Record<string, unknown>).rows)
      : [];
  const items = Array.isArray(rawItems) ? rawItems : [];
  return {
    items,
    total: typeof payload.meta?.total === "number" ? payload.meta.total : items.length,
  };
}

function withId(path: string, id: string): string {
  return `${path}/${encodeURIComponent(id)}`;
}

function withQuery(path: string, params: PipelineListParams = {}): string {
  const q = new URLSearchParams();
  if (typeof params.limit === "number" && params.limit > 0) q.set("limit", String(params.limit));
  if (params.severity) q.set("severity", params.severity);
  if (typeof params.acknowledged === "boolean") q.set("acknowledged", String(params.acknowledged));
  if (params.entity_type) q.set("entity_type", params.entity_type);
  if (params.entity_id) q.set("entity_id", params.entity_id);
  return q.toString() ? `${path}?${q.toString()}` : path;
}

export async function rollbackPipelineRevision(body: Record<string, unknown>): Promise<void> {
  await apiRequest("/v1/admin/pipeline/rollback-revision", { method: "POST", auth: true, body });
}

export async function listPipelineRevisions(params: PipelineListParams = {}): Promise<PipelineListResult> {
  const payload = await apiRequest<ListEnvelope>(withQuery("/v1/admin/pipeline/revisions", params), { method: "GET", auth: true });
  return unwrapList(payload);
}

export async function listPipelineRejected(params: PipelineListParams = {}): Promise<PipelineListResult> {
  const payload = await apiRequest<ListEnvelope>(withQuery("/v1/admin/pipeline/rejected", params), { method: "GET", auth: true });
  return unwrapList(payload);
}

export async function getPipelineHealth(): Promise<Record<string, unknown>> {
  const payload = await apiRequest<ObjectEnvelope>("/v1/admin/pipeline/health", { method: "GET", auth: true });
  return "data" in payload && payload.data ? payload.data : payload;
}

export async function getPipelineCoverage(): Promise<Record<string, unknown>> {
  const payload = await apiRequest<ObjectEnvelope>("/v1/admin/pipeline/coverage", { method: "GET", auth: true });
  return "data" in payload && payload.data ? payload.data : payload;
}

export async function listPipelineCoverageGaps(params: PipelineListParams = {}): Promise<PipelineListResult> {
  const payload = await apiRequest<ListEnvelope>(withQuery("/v1/admin/pipeline/coverage/gaps", params), { method: "GET", auth: true });
  return unwrapList(payload);
}

export async function listPipelineFreshness(params: PipelineListParams = {}): Promise<PipelineListResult> {
  const payload = await apiRequest<ListEnvelope>(withQuery("/v1/admin/pipeline/freshness", params), { method: "GET", auth: true });
  return unwrapList(payload);
}

export async function listPipelineAnomalies(params: PipelineListParams = {}): Promise<PipelineListResult> {
  const payload = await apiRequest<ListEnvelope>(withQuery("/v1/admin/pipeline/anomalies", params), { method: "GET", auth: true });
  return unwrapList(payload);
}

export async function acknowledgePipelineAnomaly(id: string, body: Record<string, unknown> = {}): Promise<void> {
  await apiRequest(withId("/v1/admin/pipeline/anomalies", `${id}/acknowledge`), {
    method: "POST",
    auth: true,
    body,
  });
}

export async function listPipelineKillSwitches(): Promise<PipelineListResult> {
  const payload = await apiRequest<ListEnvelope>("/v1/admin/pipeline/kill-switches", { method: "GET", auth: true });
  return unwrapList(payload);
}

export async function togglePipelineKillSwitch(source: string, body: Record<string, unknown>): Promise<void> {
  await apiRequest(withId("/v1/admin/pipeline/kill-switches", source), {
    method: "POST",
    auth: true,
    body,
  });
}

export async function listPipelineFieldOverrides(params: PipelineListParams = {}): Promise<PipelineListResult> {
  const payload = await apiRequest<ListEnvelope>(withQuery("/v1/admin/pipeline/field-overrides", params), { method: "GET", auth: true });
  return unwrapList(payload);
}

export async function createPipelineFieldOverride(body: Record<string, unknown>): Promise<void> {
  await apiRequest("/v1/admin/pipeline/field-overrides", { method: "POST", auth: true, body });
}

export async function updatePipelineFieldOverride(id: string, body: Record<string, unknown>): Promise<void> {
  await apiRequest(withId("/v1/admin/pipeline/field-overrides", id), { method: "PATCH", auth: true, body });
}

export async function deletePipelineFieldOverride(id: string): Promise<void> {
  await apiRequest(withId("/v1/admin/pipeline/field-overrides", id), { method: "DELETE", auth: true });
}
