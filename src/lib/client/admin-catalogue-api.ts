"use client";

import { apiRequest } from "@/lib/client/api-client";

export async function bulkImportCatalogueModels(payload: unknown): Promise<void> {
  await apiRequest("/v1/admin/catalogue/import", {
    method: "POST",
    auth: true,
    body: payload as Record<string, unknown>,
  });
}

export async function patchCatalogueModelById(id: string, payload: Record<string, unknown>): Promise<void> {
  await apiRequest(`/v1/admin/catalogue/models/${id}`, {
    method: "PATCH",
    auth: true,
    body: payload,
  });
}
