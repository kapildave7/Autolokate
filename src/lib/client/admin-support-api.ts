"use client";

import { apiRequest } from "@/lib/client/api-client";

export type AdminGrievance = Record<string, unknown> & { id?: string };
export type AdminGrievancesListResult = { items: AdminGrievance[]; total: number };

type GrievancesEnvelope =
  | AdminGrievance[]
  | {
      success?: boolean;
      data?: AdminGrievance[] | { items?: AdminGrievance[]; grievances?: AdminGrievance[]; data?: AdminGrievance[] };
      meta?: { total?: number };
    }
  | { data?: AdminGrievance[] | { items?: AdminGrievance[]; grievances?: AdminGrievance[]; data?: AdminGrievance[] }; meta?: { total?: number } };

function unwrapList(payload: GrievancesEnvelope): AdminGrievancesListResult {
  if (Array.isArray(payload)) return { items: payload, total: payload.length };
  const nested = payload.data;
  const items = Array.isArray(nested) ? nested : nested?.items ?? nested?.grievances ?? nested?.data ?? [];
  const safeItems = Array.isArray(items) ? items : [];
  return {
    items: safeItems,
    total: typeof payload.meta?.total === "number" ? payload.meta.total : safeItems.length,
  };
}

export async function listAdminGrievances(): Promise<AdminGrievancesListResult> {
  const payload = await apiRequest<GrievancesEnvelope>("/v1/admin/support/grievances", {
    method: "GET",
    auth: true,
  });
  return unwrapList(payload);
}
