"use client";

import { apiRequest } from "@/lib/client/api-client";
import { parseDealerDetailPayload, parseDealersListPayload } from "@/lib/dealers/normalize";
import type { DealerDetailPayload, DealerRow } from "@/lib/dealers/dealer-types";

type Envelope<T> = { success?: boolean; data?: T };

/**
 * GET /v1/dealers — optional filters (city_id, brand, category per API docs when added).
 */
export async function getDealers(params?: Record<string, string>): Promise<DealerRow[]> {
  const q = new URLSearchParams(params ?? {});
  const res = await apiRequest<unknown>(`/v1/dealers${q.toString() ? `?${q.toString()}` : ""}`);
  return parseDealersListPayload(res);
}

/**
 * GET /v1/dealers/nearby — requires lat, lng (valid ranges).
 */
export async function getNearbyDealers(params: {
  lat: number;
  lng: number;
  radius_km?: number;
  brand?: string;
  category?: string;
}): Promise<DealerRow[]> {
  const q = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    ...(params.radius_km != null ? { radius_km: String(params.radius_km) } : {}),
    ...(params.brand ? { brand: params.brand } : {}),
    ...(params.category ? { category: params.category } : {}),
  });
  const res = await apiRequest<unknown>(`/v1/dealers/nearby?${q.toString()}`);
  return parseDealersListPayload(res);
}

/**
 * GET /v1/dealers/:id — dealer + reviews.
 */
export async function getDealerDetails(dealerId: string): Promise<DealerDetailPayload | null> {
  const res = await apiRequest<unknown>(`/v1/dealers/${encodeURIComponent(dealerId)}`);
  return parseDealerDetailPayload(res);
}

/**
 * POST /v1/dealers/:id/reviews — authenticated; one review per user per dealer.
 */
export async function createDealerReview(
  dealerId: string,
  payload: { rating: number; review_text: string }
): Promise<unknown> {
  const res = await apiRequest<Envelope<unknown>>(`/v1/dealers/${encodeURIComponent(dealerId)}/reviews`, {
    method: "POST",
    auth: true,
    body: {
      rating: payload.rating,
      review_text: payload.review_text,
    },
  });
  if (res && typeof res === "object" && "data" in res) return (res as Envelope<unknown>).data;
  return res;
}
