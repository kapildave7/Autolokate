"use client";

import { apiRequest } from "@/lib/client/api-client";

export type PaymentItem = Record<string, unknown> & { id?: string };
export type PaymentsListResult = { items: PaymentItem[]; total: number };
export type AdminPaymentsListParams = { page?: number; limit?: number };

type PaymentsEnvelope =
  | PaymentItem[]
  | { success?: boolean; data?: PaymentItem[]; meta?: { total?: number } }
  | { data?: PaymentItem[]; meta?: { total?: number } };

function withId(path: string, id: string): string {
  return `${path}/${encodeURIComponent(id)}`;
}

function unwrapList(payload: PaymentsEnvelope): PaymentsListResult {
  if (Array.isArray(payload)) return { items: payload, total: payload.length };
  const items = payload.data ?? [];
  return {
    items,
    total: typeof payload.meta?.total === "number" ? payload.meta.total : items.length,
  };
}

export async function listAdminPayments(): Promise<PaymentsListResult> {
  return listAdminPaymentsWithParams();
}

export async function listAdminPaymentsWithParams(params: AdminPaymentsListParams = {}): Promise<PaymentsListResult> {
  const q = new URLSearchParams();
  if (typeof params.page === "number" && params.page > 0) q.set("page", String(params.page));
  if (typeof params.limit === "number" && params.limit > 0) q.set("limit", String(params.limit));
  const path = `/v1/admin/payments${q.toString() ? `?${q.toString()}` : ""}`;
  const payload = await apiRequest<PaymentsEnvelope>(path, {
    method: "GET",
    auth: true,
  });
  return unwrapList(payload);
}

export async function refundAdminPayment(id: string, body: Record<string, unknown> = {}): Promise<void> {
  await apiRequest(withId("/v1/admin/payments", `${id}/refund`), {
    method: "POST",
    auth: true,
    body,
  });
}
