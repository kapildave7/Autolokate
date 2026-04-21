"use client";

import { ApiError, apiRequest } from "@/lib/client/api-client";
import { getRememberedSupportTicketIds } from "@/lib/client/support-ticket-ids";

type Envelope<T> = { success?: boolean; data?: T };

function unbox<T>(res: Envelope<T> | T): T {
  if (res && typeof res === "object" && "data" in (res as Envelope<T>)) {
    return ((res as Envelope<T>).data ?? null) as T;
  }
  return res as T;
}

/** Allowed values from POST /v1/support/grievance validation. */
export type GrievanceCategory = "data_privacy" | "payment" | "booking" | "account" | "general";

export type GrievanceRecord = {
  id: string;
  user_id?: string;
  subject: string;
  description: string;
  category: string;
  reference_id?: string | null;
  status: string;
  resolution_notes?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
};

/** GET may return a subset of fields; use `normalizeGrievance` before UI. */
export type GrievanceDetail = Partial<Omit<GrievanceRecord, "id">> & Pick<GrievanceRecord, "id">;

export function normalizeGrievance(raw: GrievanceDetail): GrievanceRecord {
  return {
    id: raw.id,
    user_id: raw.user_id,
    subject: raw.subject ?? "",
    description: raw.description ?? "",
    category: raw.category ?? "general",
    reference_id: raw.reference_id ?? null,
    status: raw.status ?? "open",
    resolution_notes: raw.resolution_notes ?? null,
    resolved_by: raw.resolved_by ?? null,
    resolved_at: raw.resolved_at ?? null,
    created_at: raw.created_at ?? new Date().toISOString(),
    updated_at: raw.updated_at ?? raw.created_at ?? new Date().toISOString(),
  };
}

export type CreateGrievancePayload = {
  subject: string;
  description: string;
  category: GrievanceCategory;
};

/** POST /v1/support/grievance — requires auth. */
export async function createGrievance(payload: CreateGrievancePayload): Promise<GrievanceRecord> {
  const res = await apiRequest<Envelope<GrievanceRecord>>("/v1/support/grievance", {
    method: "POST",
    auth: true,
    body: {
      subject: payload.subject,
      description: payload.description,
      category: payload.category,
    },
  });
  return unbox(res) as GrievanceRecord;
}

/** GET /v1/support/grievance/:id — requires auth. */
export async function getGrievance(id: string): Promise<GrievanceRecord> {
  const res = await apiRequest<Envelope<GrievanceDetail>>(
    `/v1/support/grievance/${encodeURIComponent(id)}`,
    { auth: true }
  );
  return normalizeGrievance(unbox(res) as GrievanceDetail);
}

function readGrievanceArray(payload: unknown): GrievanceDetail[] {
  if (Array.isArray(payload)) return payload as GrievanceDetail[];
  if (payload && typeof payload === "object") {
    const o = payload as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data as GrievanceDetail[];
    if (Array.isArray(o.items)) return o.items as GrievanceDetail[];
    if (Array.isArray(o.grievances)) return o.grievances as GrievanceDetail[];
  }
  return [];
}

/**
 * GET /v1/support/grievance — list current user’s tickets (when backend exposes it).
 * Returns [] if the route is missing or empty.
 */
export async function listMyGrievancesFromApi(): Promise<GrievanceRecord[]> {
  try {
    const res = await apiRequest<Envelope<unknown>>("/v1/support/grievance", { auth: true });
    const raw = unbox(res);
    return readGrievanceArray(raw).map((r) => normalizeGrievance(r));
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 405 || e.status === 501)) {
      return [];
    }
    throw e;
  }
}

function sortByUpdatedDesc(a: GrievanceRecord, b: GrievanceRecord): number {
  return String(b.updated_at).localeCompare(String(a.updated_at));
}

/**
 * Tickets for the signed-in user: tries collection GET, then hydrates remembered ids by detail GET.
 */
export async function fetchMySupportTickets(): Promise<GrievanceRecord[]> {
  let fromApi: GrievanceRecord[] = [];
  try {
    fromApi = await listMyGrievancesFromApi();
  } catch {
    fromApi = [];
  }

  if (fromApi.length > 0) {
    return [...fromApi].sort(sortByUpdatedDesc);
  }

  const ids = getRememberedSupportTicketIds();
  if (ids.length === 0) return [];

  const settled = await Promise.all(
    ids.slice(0, 25).map((id) => getGrievance(id).catch(() => null))
  );
  const rows = settled.filter((x): x is GrievanceRecord => x != null);
  return rows.sort(sortByUpdatedDesc);
}

export { rememberSupportTicketId } from "@/lib/client/support-ticket-ids";
