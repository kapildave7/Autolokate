"use client";

import { apiRequest } from "@/lib/client/api-client";

export type AdminRole = "user" | "admin" | "super_admin";

export type AdminUser = {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  role?: AdminRole | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type AdminUsersListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export type AdminUsersListResult = {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
};

type ListEnvelope = {
  success?: boolean;
  data?:
    | AdminUser[]
    | {
        items?: AdminUser[];
        users?: AdminUser[];
        total?: number;
        page?: number;
        limit?: number;
      };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
  items?: AdminUser[];
  users?: AdminUser[];
  total?: number;
  page?: number;
  limit?: number;
};

function toQuery(params: AdminUsersListParams): string {
  const query = new URLSearchParams();
  if (typeof params.page === "number") query.set("page", String(params.page));
  if (typeof params.limit === "number") query.set("limit", String(params.limit));
  if (params.search?.trim()) query.set("search", params.search.trim());
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

function toListResult(payload: ListEnvelope, params: AdminUsersListParams): AdminUsersListResult {
  const data = payload.data;
  const nestedData = data && !Array.isArray(data) ? data : undefined;
  const items =
    (Array.isArray(data) ? data : undefined) ??
    nestedData?.items ??
    nestedData?.users ??
    payload.items ??
    payload.users ??
    [];
  return {
    items: Array.isArray(items) ? items : [],
    total: nestedData?.total ?? payload.meta?.total ?? payload.total ?? (Array.isArray(items) ? items.length : 0),
    page: nestedData?.page ?? payload.meta?.page ?? payload.page ?? params.page ?? 1,
    limit: nestedData?.limit ?? payload.meta?.limit ?? payload.limit ?? params.limit ?? 10,
  };
}

export async function listAdminUsers(params: AdminUsersListParams): Promise<AdminUsersListResult> {
  const payload = await apiRequest<ListEnvelope>(`/v1/admin/users${toQuery(params)}`, {
    method: "GET",
    auth: true,
  });
  return toListResult(payload, params);
}

export async function getAdminUserById(id: string): Promise<AdminUser> {
  const payload = await apiRequest<{ data?: AdminUser } | AdminUser>(`/v1/admin/users/${id}`, {
    method: "GET",
    auth: true,
  });
  return "data" in payload && payload.data ? payload.data : payload;
}

export async function deleteAdminUserById(id: string): Promise<void> {
  await apiRequest(`/v1/admin/users/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function updateAdminUserRole(id: string, role: AdminRole): Promise<void> {
  await apiRequest(`/v1/admin/users/${id}/role`, {
    method: "PATCH",
    auth: true,
    body: { role },
  });
}
