import { unwrapSeoPayload } from "@/lib/seo/seo-public-api";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Collect JSON-LD nodes from structured-data API or composite page payload. */
export function collectJsonLdNodes(...sources: Array<unknown | null | undefined>): unknown[] {
  const out: unknown[] = [];
  const seen = new Set<string>();

  const pushOne = (node: unknown) => {
    if (node == null || typeof node !== "object") return;
    try {
      const key = JSON.stringify(node);
      if (seen.has(key)) return;
      seen.add(key);
      out.push(node);
    } catch {
      out.push(node);
    }
  };

  const pushGraph = (v: unknown) => {
    if (v == null) return;
    if (Array.isArray(v)) {
      for (const n of v) {
        if (n && typeof n === "object") pushOne(n);
      }
      return;
    }
    if (typeof v === "object") pushOne(v);
  };

  for (const src of sources) {
    if (src == null) continue;
    const raw = unwrapSeoPayload(src);
    if (raw == null) continue;

    if (Array.isArray(raw)) {
      pushGraph(raw);
      continue;
    }

    if (!isRecord(raw)) continue;

    if ("@graph" in raw && Array.isArray(raw["@graph"])) {
      pushGraph(raw["@graph"]);
      continue;
    }

    const nested =
      raw.structured_data ??
      raw.structuredData ??
      raw.json_ld ??
      raw.jsonLd ??
      raw.graph ??
      raw.schema;

    if (nested !== undefined) {
      if (Array.isArray(nested)) pushGraph(nested);
      else if (isRecord(nested) && Array.isArray(nested["@graph"])) pushGraph(nested["@graph"]);
      else pushGraph(nested);
    }

    const crumbs = raw.breadcrumbs ?? raw.breadcrumb;
    if (crumbs !== undefined && typeof crumbs === "object" && !Array.isArray(crumbs)) {
      pushGraph(crumbs);
    }

    if (nested === undefined && ("@context" in raw || "@type" in raw)) {
      pushGraph(raw);
    }
  }

  return out;
}
