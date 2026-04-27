"use client";

import { apiRequest } from "@/lib/client/api-client";

export type AdminDashboardStats = {
  total_users?: number;
  total_bookings?: number;
  total_revenue?: number;
  scrape_status?: string;
  users?: number;
  bookings?: number;
  revenue?: number;
  [key: string]: unknown;
};

export type AdminDashboardUser = {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  role?: string | null;
  city_id?: string | null;
  is_pending_deletion?: boolean;
  created_at?: string | null;
  [key: string]: unknown;
};

type StatsEnvelope = { data?: AdminDashboardStats } | AdminDashboardStats;
export type AdminDashboardUsersResult = {
  items: AdminDashboardUser[];
  count: number;
  cursor: string | null;
};

type UsersEnvelope =
  | {
      success?: boolean;
      data?: {
        data?: AdminDashboardUser[];
        items?: AdminDashboardUser[];
        users?: AdminDashboardUser[];
        count?: number;
        cursor?: string | null;
      };
    }
  | { data?: { items?: AdminDashboardUser[]; users?: AdminDashboardUser[]; count?: number; cursor?: string | null } }
  | { items?: AdminDashboardUser[]; users?: AdminDashboardUser[]; count?: number; cursor?: string | null }
  | AdminDashboardUser[];

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const payload = await apiRequest<StatsEnvelope>("/v1/admin/dashboard/stats", {
    method: "GET",
    auth: true,
  });
  return "data" in payload && payload.data ? payload.data : payload;
}

export async function listAdminDashboardUsers(
  params: { search?: string; role?: string; cursor?: string; limit?: number } = {}
): Promise<AdminDashboardUsersResult> {
  const q = new URLSearchParams();
  if (params.search?.trim()) q.set("search", params.search.trim());
  if (params.role?.trim() && params.role !== "all") q.set("role", params.role);
  if (params.cursor?.trim()) q.set("cursor", params.cursor.trim());
  if (typeof params.limit === "number" && params.limit > 0) q.set("limit", String(params.limit));
  const qs = q.toString();
  const path = `/v1/admin/dashboard/users${qs ? `?${qs}` : ""}`;

  const payload = await apiRequest<UsersEnvelope>(path, {
    method: "GET",
    auth: true,
  });

  if (Array.isArray(payload)) {
    return { items: payload, count: payload.length, cursor: null };
  }

  if ("data" in payload && payload.data) {
    const items = payload.data.data ?? payload.data.items ?? payload.data.users ?? [];
    return {
      items,
      count: typeof payload.data.count === "number" ? payload.data.count : items.length,
      cursor: typeof payload.data.cursor === "string" ? payload.data.cursor : null,
    };
  }

  const items = payload.items ?? payload.users ?? [];
  return {
    items,
    count: typeof payload.count === "number" ? payload.count : items.length,
    cursor: typeof payload.cursor === "string" ? payload.cursor : null,
  };
}
