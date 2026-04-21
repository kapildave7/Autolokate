import { parseDealerDetailPayload, parseDealersListPayload } from "@/lib/dealers/normalize";
import type { DealerDetailPayload, DealerRow } from "@/lib/dealers/dealer-types";

const DEFAULT_BASE = "https://autolokate-api-staging-2j5tqz76xa-el.a.run.app";

function apiBase(): string {
  return (process.env.NEXT_PUBLIC_AUTOLOKATE_API_BASE_URL ?? DEFAULT_BASE).replace(/\/$/, "");
}

async function fetchJson(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
    next: { revalidate: 120 },
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json().catch(() => ({}));
}

/** Server-safe: list dealers (optional query e.g. city_id, brand). */
export async function fetchDealersListPublic(params?: Record<string, string>): Promise<DealerRow[]> {
  const q = new URLSearchParams(params ?? {});
  const suffix = q.toString() ? `?${q.toString()}` : "";
  const json = await fetchJson(`/v1/dealers${suffix}`);
  return parseDealersListPayload(json);
}

/** Server-safe: dealer detail + reviews. */
export async function fetchDealerDetailPublic(dealerId: string): Promise<DealerDetailPayload | null> {
  const json = await fetchJson(`/v1/dealers/${encodeURIComponent(dealerId)}`);
  return parseDealerDetailPayload(json);
}
