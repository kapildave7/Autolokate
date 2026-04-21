import type { LegalDocument } from "@/lib/legal/legal-types";
import { unwrapLegalData } from "@/lib/legal/parse-envelope";

const DEFAULT_BASE = "https://autolokate-api-staging-2j5tqz76xa-el.a.run.app";

function apiBase(): string {
  return (process.env.NEXT_PUBLIC_AUTOLOKATE_API_BASE_URL ?? DEFAULT_BASE).replace(/\/$/, "");
}

async function fetchLegalDocument(path: string): Promise<LegalDocument | null> {
  try {
    const res = await fetch(`${apiBase()}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = (await res.json().catch(() => null)) as unknown;
    return unwrapLegalData(json);
  } catch {
    return null;
  }
}

export async function fetchPrivacyPolicy(): Promise<LegalDocument | null> {
  return fetchLegalDocument("/v1/legal/privacy-policy");
}

export async function fetchTermsOfService(): Promise<LegalDocument | null> {
  return fetchLegalDocument("/v1/legal/terms");
}

export async function fetchRefundPolicy(): Promise<LegalDocument | null> {
  return fetchLegalDocument("/v1/legal/refund-policy");
}
