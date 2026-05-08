"use client";

import { apiRequest } from "@/lib/client/api-client";

export type ScrapeRun = Record<string, unknown> & { id?: string };
export type ScrapeLog = Record<string, unknown>;

export type ScrapeRunsResult = {
  items: ScrapeRun[];
  total: number;
  page: number;
  limit: number;
};

type RunsEnvelope =
  | ScrapeRun[]
  | {
      success?: boolean;
      data?: {
        items?: ScrapeRun[];
        runs?: ScrapeRun[];
        data?: ScrapeRun[];
        total?: number;
        page?: number;
        limit?: number;
      };
      meta?: { total?: number };
    }
  | {
      data?: ScrapeRun[];
      items?: ScrapeRun[];
      runs?: ScrapeRun[];
      meta?: { total?: number };
    };

type ObjectEnvelope = Record<string, unknown> | { data?: Record<string, unknown> };
type LogsEnvelope = ScrapeLog[] | { data?: ScrapeLog[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toQuery(page: number, limit: number): string {
  const q = new URLSearchParams();
  q.set("page", String(page));
  q.set("limit", String(limit));
  return q.toString();
}

function unwrapRuns(payload: RunsEnvelope, page: number, limit: number): ScrapeRunsResult {
  if (Array.isArray(payload)) {
    return { items: payload, total: payload.length, page, limit };
  }

  if ("success" in payload && payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    const items = payload.data.items ?? payload.data.runs ?? payload.data.data ?? [];
    const total =
      typeof payload.data.total === "number"
        ? payload.data.total
        : typeof payload.meta?.total === "number"
          ? payload.meta.total
          : items.length;
    return {
      items,
      total,
      page: typeof payload.data.page === "number" ? payload.data.page : page,
      limit: typeof payload.data.limit === "number" ? payload.data.limit : limit,
    };
  }

  const itemsFromData = Array.isArray(payload.data) ? payload.data : [];
  const itemsFromItems = "items" in payload && Array.isArray(payload.items) ? payload.items : [];
  const itemsFromRuns = "runs" in payload && Array.isArray(payload.runs) ? payload.runs : [];
  const items = itemsFromData.length > 0 ? itemsFromData : itemsFromItems.length > 0 ? itemsFromItems : itemsFromRuns;
  const total = typeof payload.meta?.total === "number" ? payload.meta.total : items.length;
  return { items, total, page, limit };
}

export async function triggerScraperEnrich(brand: string): Promise<void> {
  await apiRequest("/v1/admin/scraper/enrich", {
    method: "POST",
    auth: true,
    body: { brand },
  });
}

/** `source` values defined by the OpenAPI `TriggerScrapeDto` enum. */
export type ScrapeSource =
  | "all"
  | "maruti-suzuki"
  | "tata-motors"
  | "hyundai"
  | "mahindra"
  | "kia"
  | "hero-motocorp"
  | "bajaj-auto"
  | "royal-enfield";

/**
 * POST /v1/admin/scraper — `source` is required per `TriggerScrapeDto`.
 * Defaults to `"all"` when none is provided.
 */
export async function triggerManualScrapeRun(
  source: ScrapeSource = "all",
  extra: Record<string, unknown> = {}
): Promise<void> {
  await apiRequest("/v1/admin/scraper", {
    method: "POST",
    auth: true,
    body: { source, ...extra },
  });
}

export async function listScraperRuns(page = 1, limit = 10): Promise<ScrapeRunsResult> {
  const payload = await apiRequest<RunsEnvelope>(`/v1/admin/scraper/runs?${toQuery(page, limit)}`, {
    method: "GET",
    auth: true,
  });
  return unwrapRuns(payload, page, limit);
}

export async function getScraperRunById(id: string): Promise<Record<string, unknown>> {
  const payload = await apiRequest<ObjectEnvelope>(`/v1/admin/scraper/runs/${encodeURIComponent(id)}`, {
    method: "GET",
    auth: true,
  });
  if (isRecord(payload) && "data" in payload && isRecord(payload.data)) {
    return payload.data;
  }
  return isRecord(payload) ? payload : {};
}

export async function getScraperRunLogs(id: string): Promise<ScrapeLog[]> {
  const payload = await apiRequest<LogsEnvelope>(`/v1/admin/scraper/runs/${encodeURIComponent(id)}/logs`, {
    method: "GET",
    auth: true,
  });
  return Array.isArray(payload) ? payload : payload.data ?? [];
}
