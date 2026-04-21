import type { MetadataRoute } from "next";
import { unwrapSeoPayload } from "@/lib/seo/seo-public-api";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function toDate(v: unknown): Date | undefined {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return undefined;
}

function normalizeEntry(
  item: unknown
): MetadataRoute.Sitemap[number] | null {
  if (typeof item === "string" && item.startsWith("http")) {
    return { url: item, changeFrequency: "weekly", priority: 0.7 };
  }
  if (!isRecord(item)) return null;
  const url = item.url ?? item.loc ?? item.href;
  if (typeof url !== "string" || !url.startsWith("http")) return null;
  const lastModified = toDate(item.lastModified ?? item.lastmod ?? item.updated_at);
  const changeFrequency = item.changeFrequency ?? item.changefreq;
  const priority = typeof item.priority === "number" ? item.priority : undefined;
  return {
    url,
    ...(lastModified ? { lastModified } : {}),
    ...(typeof changeFrequency === "string"
      ? { changeFrequency: changeFrequency as MetadataRoute.Sitemap[0]["changeFrequency"] }
      : {}),
    ...(priority !== undefined ? { priority } : {}),
  };
}

/**
 * Turn `/v1/seo/sitemap` JSON into Next.js sitemap entries (best-effort across shapes).
 */
export function seoSitemapPayloadToEntries(payload: unknown): MetadataRoute.Sitemap {
  const raw = unwrapSeoPayload(payload);
  if (raw == null) return [];

  if (Array.isArray(raw)) {
    return raw.map(normalizeEntry).filter((x): x is MetadataRoute.Sitemap[number] => x !== null);
  }

  if (!isRecord(raw)) return [];

  const keys = ["urls", "items", "entries", "data", "pages", "locales"] as const;
  for (const k of keys) {
    const arr = raw[k];
    if (Array.isArray(arr)) {
      return arr.map(normalizeEntry).filter((x): x is MetadataRoute.Sitemap[number] => x !== null);
    }
  }

  const sitemaps = raw.sitemaps ?? raw.children;
  if (Array.isArray(sitemaps)) {
    const urls = sitemaps
      .map((s) => {
        if (typeof s === "string") return s;
        if (isRecord(s) && typeof s.loc === "string") return s.loc;
        if (isRecord(s) && typeof s.url === "string") return s.url;
        return null;
      })
      .filter((x): x is string => typeof x === "string" && x.startsWith("http"));
    return urls.map((url) => ({ url, changeFrequency: "weekly" as const, priority: 0.65 }));
  }

  return [];
}

export function dedupeSitemapByUrl(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const seen = new Set<string>();
  const out: MetadataRoute.Sitemap = [];
  for (const e of entries) {
    if (!e?.url || seen.has(e.url)) continue;
    seen.add(e.url);
    out.push(e);
  }
  return out;
}
