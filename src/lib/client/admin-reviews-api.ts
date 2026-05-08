"use client";

import { apiRequest } from "@/lib/client/api-client";

export type ReviewStatus = "draft" | "published" | "archived";
export type AdminReviewType = "model" | "variant";

export type AdminReview = {
  id: string;
  title?: string | null;
  content?: string | null;
  summary?: string | null;
  status?: ReviewStatus | string | null;
  rating?: number | null;
  model_id?: string | null;
  variant_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type ListAdminReviewsParams = {
  type: AdminReviewType;
  page?: number;
  limit?: number;
  search?: string;
  status?: ReviewStatus | "all";
};

export type ListAdminReviewsResult = {
  items: AdminReview[];
  total: number;
  page: number;
  limit: number;
};

export type CreateAdminReviewPayload = {
  type: AdminReviewType;
  targetId: string;
  title: string;
  content: string;
  summary?: string;
  rating?: number | null;
};

export type UpdateAdminReviewPayload = {
  type: AdminReviewType;
  id: string;
  title?: string;
  content?: string;
  summary?: string;
  rating?: number | null;
};

type ListEnvelope = {
  data?: {
    items?: AdminReview[];
    reviews?: AdminReview[];
    total?: number;
    page?: number;
    limit?: number;
  };
  items?: AdminReview[];
  reviews?: AdminReview[];
  total?: number;
  page?: number;
  limit?: number;
};

function listPath(type: AdminReviewType): string {
  return type === "model" ? "/v1/admin/catalogue/reviews" : "/v1/admin/catalogue/variant-reviews";
}

function itemPath(type: AdminReviewType, id: string): string {
  return `${listPath(type)}/${id}`;
}

function statusPath(type: AdminReviewType, id: string): string {
  return `${listPath(type)}/${id}/status`;
}

function toQuery(params: ListAdminReviewsParams): string {
  const q = new URLSearchParams();
  if (params.search?.trim()) q.set("search", params.search.trim());
  if (params.status && params.status !== "all") q.set("status", params.status);
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

function toListResult(payload: ListEnvelope, params: ListAdminReviewsParams): ListAdminReviewsResult {
  const data = payload.data;
  const items = data?.items ?? data?.reviews ?? payload.items ?? payload.reviews ?? [];
  const normalizedItems = Array.isArray(items) ? items : [];
  const page = params.page ?? 1;
  const limit = params.limit ?? (normalizedItems.length || 10);
  const startIndex = Math.max(0, (page - 1) * limit);
  const endIndex = startIndex + limit;
  const pagedItems = normalizedItems.slice(startIndex, endIndex);

  return {
    items: pagedItems,
    total: data?.total ?? payload.total ?? normalizedItems.length,
    page,
    limit,
  };
}

export async function listAdminReviews(params: ListAdminReviewsParams): Promise<ListAdminReviewsResult> {
  const payload = await apiRequest<ListEnvelope>(`${listPath(params.type)}${toQuery(params)}`, {
    method: "GET",
    auth: true,
  });
  return toListResult(payload, params);
}

export async function createAdminReview(payload: CreateAdminReviewPayload): Promise<void> {
  const body: Record<string, unknown> = {
    title: payload.title,
    content: payload.content,
  };
  if (payload.summary?.trim()) body.summary = payload.summary.trim();
  if (typeof payload.rating === "number") body.rating = payload.rating;
  if (payload.type === "model") body.model_id = payload.targetId;
  if (payload.type === "variant") body.variant_id = payload.targetId;

  await apiRequest(listPath(payload.type), {
    method: "POST",
    auth: true,
    body,
  });
}

export async function updateAdminReview(payload: UpdateAdminReviewPayload): Promise<void> {
  const body: Record<string, unknown> = {};
  if (payload.title !== undefined) body.title = payload.title;
  if (payload.content !== undefined) body.content = payload.content;
  if (payload.summary !== undefined) body.summary = payload.summary;
  if (payload.rating !== undefined) body.rating = payload.rating;

  await apiRequest(itemPath(payload.type, payload.id), {
    method: "PATCH",
    auth: true,
    body,
  });
}

export async function deleteAdminReview(type: AdminReviewType, id: string): Promise<void> {
  await apiRequest(itemPath(type, id), {
    method: "DELETE",
    auth: true,
  });
}

export async function updateAdminReviewStatus(type: AdminReviewType, id: string, status: ReviewStatus): Promise<void> {
  await apiRequest(statusPath(type, id), {
    method: "PATCH",
    auth: true,
    body: { status },
  });
}
