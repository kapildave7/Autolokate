import type { LegalDocument } from "@/lib/legal/legal-types";

type Envelope<T> = { success?: boolean; data?: T };

/** Unwrap `{ success, data }` from legal API responses. */
export function unwrapLegalData(payload: unknown): LegalDocument | null {
  if (payload == null || typeof payload !== "object") return null;
  const o = payload as Envelope<LegalDocument>;
  const d = o.data;
  if (!d || typeof d !== "object") return null;
  if (typeof (d as LegalDocument).content !== "string") return null;
  return d as LegalDocument;
}
