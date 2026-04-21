"use client";

import { apiRequest } from "@/lib/client/api-client";
import type { LegalDocument } from "@/lib/legal/legal-types";
import { unwrapLegalData } from "@/lib/legal/parse-envelope";

type Envelope<T> = { success?: boolean; data?: T };
const unbox = <T,>(res: Envelope<T> | T): T =>
  (res && typeof res === "object" && "data" in (res as Envelope<T>) ? ((res as Envelope<T>).data as T) : (res as T));

export async function exportMyData() {
  const res = await apiRequest<Envelope<{ url?: string }>>("/v1/auth/me/export", { auth: true });
  return unbox(res);
}

export async function scheduleAccountDelete() {
  const res = await apiRequest<Envelope<unknown>>("/v1/auth/me", { method: "DELETE", auth: true });
  return unbox(res);
}

export async function createGrievance(payload: {
  category: string;
  subject: string;
  body: string;
  evidence_urls?: string[];
}) {
  const res = await apiRequest<Envelope<unknown>>("/v1/support/grievance", {
    method: "POST",
    auth: true,
    body: payload,
  });
  return unbox(res);
}

export async function getGrievance(grievanceId: string) {
  const res = await apiRequest<Envelope<unknown>>(`/v1/support/grievance/${grievanceId}`, { auth: true });
  return unbox(res);
}

export async function getPrivacyPolicy(): Promise<LegalDocument | null> {
  const res = await apiRequest<unknown>("/v1/legal/privacy-policy");
  return unwrapLegalData(res);
}

export async function getTerms(): Promise<LegalDocument | null> {
  const res = await apiRequest<unknown>("/v1/legal/terms");
  return unwrapLegalData(res);
}

export async function getRefundPolicy(): Promise<LegalDocument | null> {
  const res = await apiRequest<unknown>("/v1/legal/refund-policy");
  return unwrapLegalData(res);
}
