"use client";

import { apiRequest } from "@/lib/client/api-client";

export type AdminBooking = Record<string, unknown> & { id?: string };
export type AdminBookingsListResult = { items: AdminBooking[]; total: number };
export type AdminBookingsListParams = { page?: number; limit?: number };

type BookingsEnvelope =
  | AdminBooking[]
  | { success?: boolean; data?: AdminBooking[]; meta?: { total?: number } }
  | { data?: AdminBooking[]; meta?: { total?: number } };

function withId(path: string, id: string): string {
  return `${path}/${encodeURIComponent(id)}`;
}

function unwrapList(payload: BookingsEnvelope): AdminBookingsListResult {
  if (Array.isArray(payload)) return { items: payload, total: payload.length };
  const items = payload.data ?? [];
  return {
    items,
    total: typeof payload.meta?.total === "number" ? payload.meta.total : items.length,
  };
}

export async function listAdminBookings(): Promise<AdminBookingsListResult> {
  return listAdminBookingsWithParams();
}

export async function listAdminBookingsWithParams(params: AdminBookingsListParams = {}): Promise<AdminBookingsListResult> {
  const q = new URLSearchParams();
  if (typeof params.page === "number" && params.page > 0) q.set("page", String(params.page));
  if (typeof params.limit === "number" && params.limit > 0) q.set("limit", String(params.limit));
  const path = `/v1/admin/bookings${q.toString() ? `?${q.toString()}` : ""}`;
  const payload = await apiRequest<BookingsEnvelope>(path, {
    method: "GET",
    auth: true,
  });
  return unwrapList(payload);
}

export async function updateAdminBooking(id: string, body: Record<string, unknown>): Promise<void> {
  await apiRequest(withId("/v1/admin/bookings", id), {
    method: "PATCH",
    auth: true,
    body,
  });
}
