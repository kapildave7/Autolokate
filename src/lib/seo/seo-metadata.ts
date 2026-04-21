import type { Metadata } from "next";
import type { MetadataRoute } from "next";
import { unwrapSeoPayload } from "@/lib/seo/seo-public-api";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown): string | undefined {
  if (typeof v === "string" && v.trim()) return v.trim();
  return undefined;
}

function strOrJoin(v: unknown): string | undefined {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "string")) return (v as string[]).join(", ");
  return undefined;
}

/** Page API wraps fields in `data.meta`; flat meta API uses the same keys at `data` root. */
function flattenSeoMetaLayer(payload: unknown): Record<string, unknown> | null {
  const raw = unwrapSeoPayload<unknown>(payload);
  if (raw == null) return null;
  if (Array.isArray(raw)) return null;
  if (!isRecord(raw)) return null;
  if (isRecord(raw.meta)) {
    const m = raw.meta;
    return {
      ...m,
      canonical_url: (raw.canonical_url ?? m.canonical_url) as unknown,
      canonical: (raw.canonical ?? m.canonical) as unknown,
    };
  }
  return raw;
}

/** Matches Next.js `OpenGraphType` (og:product and other FB types are not supported). */
type NextOpenGraphType =
  | "article"
  | "book"
  | "music.song"
  | "music.album"
  | "music.playlist"
  | "music.radio_station"
  | "profile"
  | "website"
  | "video.tv_show"
  | "video.other"
  | "video.movie"
  | "video.episode";

/**
 * Next.js `openGraph.type` only allows a subset of og:type values (see `OpenGraphType`).
 * API may send `product`, `place`, etc. — map those to a supported type to avoid runtime errors.
 */
function normalizeOpenGraphType(raw: string | undefined): NextOpenGraphType | undefined {
  const allowed = new Set<string>([
    "article",
    "book",
    "music.song",
    "music.album",
    "music.playlist",
    "music.radio_station",
    "profile",
    "website",
    "video.tv_show",
    "video.other",
    "video.movie",
    "video.episode",
  ]);
  if (!raw?.trim()) return undefined;
  const t = raw.trim().toLowerCase();
  if (allowed.has(t)) return t as NextOpenGraphType;
  if (t === "product") return "website";
  return "website";
}

function toRobots(
  v: unknown
): Metadata["robots"] | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") {
    const s = v.toLowerCase();
    const index = !s.includes("noindex");
    const follow = !s.includes("nofollow");
    return { index, follow };
  }
  if (!isRecord(v)) return undefined;
  const index = typeof v.index === "boolean" ? v.index : undefined;
  const follow = typeof v.follow === "boolean" ? v.follow : undefined;
  if (index === undefined && follow === undefined) return undefined;
  return {
    ...(index !== undefined ? { index } : {}),
    ...(follow !== undefined ? { follow } : {}),
  };
}

/**
 * Map arbitrary API meta JSON (or unwrapped record) into Next.js Metadata.
 * Supports Autolokate API flat keys (`og_*`, `twitter_*`), nested `openGraph`, and `data.meta` on page responses.
 */
export function seoPayloadToMetadata(payload: unknown): Metadata | null {
  const r = flattenSeoMetaLayer(payload);
  if (!r) return null;

  const title = str(r.title ?? r.meta_title ?? r.page_title);
  const description = str(r.description ?? r.meta_description);

  const canonical =
    str(r.canonical ?? r.canonical_url) ??
    (isRecord(r.alternates) ? str(r.alternates.canonical) : undefined);

  const keywords = strOrJoin(r.keywords ?? r.keyword);

  const og = isRecord(r.openGraph) ? r.openGraph : isRecord(r.open_graph) ? r.open_graph : isRecord(r.og) ? r.og : null;
  const tw = isRecord(r.twitter) ? r.twitter : null;

  const ogTitle =
    (og ? str(og.title) : undefined) ?? str(r.og_title);
  const ogDesc =
    (og ? str(og.description) : undefined) ?? str(r.og_description);
  const ogUrl = (og ? str(og.url) : undefined) ?? str(r.og_url);
  const ogTypeRaw = (og ? str(og.type) : undefined) ?? str(r.og_type);
  const ogType = normalizeOpenGraphType(ogTypeRaw);
  const ogLocale = (og ? str(og.locale) : undefined) ?? str(r.og_locale);
  const ogSiteName = (og ? str(og.site_name ?? og.siteName) : undefined) ?? str(r.og_site_name);
  const modifiedTime = str(r.modified_time);

  type OgImages = NonNullable<NonNullable<Metadata["openGraph"]>["images"]>;
  let ogImages: OgImages | undefined;
  if (og && og.images !== undefined) {
    const im = og.images;
    if (typeof im === "string") {
      ogImages = [{ url: im }] as OgImages;
    } else if (Array.isArray(im)) {
      ogImages = im
        .map((item) => {
          if (typeof item === "string") return { url: item };
          if (isRecord(item) && str(item.url)) return { url: str(item.url)!, alt: str(item.alt) };
          return { url: "" };
        })
        .filter((x) => x.url) as OgImages;
    } else if (isRecord(im) && str(im.url)) {
      ogImages = [{ url: str(im.url)!, alt: str(im.alt) }] as OgImages;
    }
  }
  const flatOgImage = str(r.og_image);
  const flatOgAlt = str(r.og_image_alt);
  const missingOgImages =
    flatOgImage &&
    (ogImages == null ||
      (Array.isArray(ogImages) && ogImages.length === 0));
  if (missingOgImages) {
    ogImages = [{ url: flatOgImage, ...(flatOgAlt ? { alt: flatOgAlt } : {}) }] as OgImages;
  }

  const twCard =
    (tw ? str(tw.card) : undefined) ??
    (str(r.twitter_card) as Metadata["twitter"] extends { card?: infer C } ? C : undefined);
  const twTitle = (tw ? str(tw.title) : undefined) ?? str(r.twitter_title);
  const twDesc = (tw ? str(tw.description) : undefined) ?? str(r.twitter_description);
  const twImage = str(r.twitter_image);

  const hasOgFlat =
    r.og_title ||
    r.og_description ||
    r.og_image ||
    r.og_url ||
    r.og_type ||
    r.og_site_name ||
    r.og_locale;
  const hasTwFlat = r.twitter_card || r.twitter_title || r.twitter_description || r.twitter_image;

  if (
    !title &&
    !description &&
    !canonical &&
    !keywords &&
    !og &&
    !tw &&
    !r.robots &&
    !hasOgFlat &&
    !hasTwFlat
  ) {
    return null;
  }

  const authorName = str(r.author);
  const metadata: Metadata = {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(keywords ? { keywords } : {}),
    ...(canonical ? { alternates: { canonical } } : {}),
    ...(authorName ? { authors: [{ name: authorName }] } : {}),
    ...(r.robots !== undefined ? { robots: toRobots(r.robots) } : {}),
    ...(ogTitle || ogDesc || ogUrl || ogType || ogImages || ogLocale || ogSiteName || modifiedTime
      ? {
          openGraph: {
            ...(ogTitle ? { title: ogTitle } : {}),
            ...(ogDesc ? { description: ogDesc } : {}),
            ...(ogUrl ? { url: ogUrl } : {}),
            ...(ogType ? { type: ogType } : {}),
            ...(ogLocale ? { locale: ogLocale } : {}),
            ...(ogSiteName ? { siteName: ogSiteName } : {}),
            ...(ogImages ? { images: ogImages } : {}),
            ...(modifiedTime ? { modifiedTime } : {}),
          },
        }
      : {}),
    ...(twTitle || twDesc || twCard || twImage
      ? {
          twitter: {
            ...(twCard ? { card: twCard } : {}),
            ...(twTitle ? { title: twTitle } : {}),
            ...(twDesc ? { description: twDesc } : {}),
            ...(twImage ? { images: [twImage] } : {}),
          },
        }
      : {}),
  };

  return metadata;
}

export function mergeMetadata(base: Metadata, overlay: Metadata | null | undefined): Metadata {
  if (!overlay) return base;
  return {
    ...base,
    ...overlay,
    alternates: { ...base.alternates, ...overlay.alternates },
    openGraph: overlay.openGraph ? { ...base.openGraph, ...overlay.openGraph } : base.openGraph,
    twitter: overlay.twitter ? { ...base.twitter, ...overlay.twitter } : base.twitter,
    robots: overlay.robots ?? base.robots,
  };
}

/** Map SEO meta API response (envelope or raw) to Metadata. */
export function seoMetaResponseToMetadata(payload: unknown): Metadata | null {
  return seoPayloadToMetadata(payload);
}

/** Parse robots.txt body (API may return JSON `{ data: "User-agent:...\\n" }`). */
export function parseRobotsPlainText(text: string): MetadataRoute.Robots | null {
  if (!text.trim()) return null;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const disallow: string[] = [];
  const allow: string[] = [];
  const sitemaps: string[] = [];
  let inStarBlock = false;
  for (const line of lines) {
    const m = /^([\w-]+):\s*(.*)$/i.exec(line);
    if (!m) continue;
    const key = m[1]!.toLowerCase();
    const val = m[2]!.trim();
    if (key === "user-agent") {
      inStarBlock = val === "*" || val === "Mozilla/5.0 (*)";
      continue;
    }
    if (key === "sitemap") {
      sitemaps.push(val);
      continue;
    }
    if (!inStarBlock) continue;
    if (key === "disallow") disallow.push(val);
    if (key === "allow") allow.push(val);
  }

  const out: MetadataRoute.Robots = {
    rules: {
      userAgent: "*",
      ...(allow.length ? { allow } : { allow: "/" }),
      ...(disallow.length ? { disallow } : {}),
    },
  };
  if (sitemaps.length) out.sitemap = sitemaps.length === 1 ? sitemaps[0]! : sitemaps;
  return out;
}

/** Parse `/v1/seo/robots` body into Next metadata robots + optional sitemap list. */
export async function parseSeoRobotsResponse(res: Response): Promise<{
  robots: MetadataRoute.Robots;
} | null> {
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("json")) {
    const json = (await res.json().catch(() => null)) as unknown;
    const raw = unwrapSeoPayload(json);
    if (typeof raw === "string") {
      const parsed = parseRobotsPlainText(raw);
      return parsed ? { robots: parsed } : null;
    }
    if (!isRecord(raw)) return null;

    const sitemapRaw = raw.sitemap ?? raw.sitemaps;
    let sitemap: string | string[] | undefined;
    if (typeof sitemapRaw === "string") sitemap = sitemapRaw;
    else if (Array.isArray(sitemapRaw)) {
      const urls = sitemapRaw.filter((x): x is string => typeof x === "string");
      if (urls.length) sitemap = urls.length === 1 ? urls[0]! : urls;
    }

    const host = str(raw.host);

    const rulesBlock = raw.rules ?? raw.rule;
    const mapOne = (o: Record<string, unknown>): MetadataRoute.Robots["rules"] => {
      const ua = o.userAgent ?? o.user_agent;
      const allow = o.allow;
      const disallow = o.disallow;
      const crawlDelay = o.crawlDelay ?? o.crawl_delay;
      const rule: Record<string, unknown> = {};
      if (typeof ua === "string" || Array.isArray(ua)) rule.userAgent = ua;
      if (typeof allow === "string" || Array.isArray(allow)) rule.allow = allow;
      if (typeof disallow === "string" || Array.isArray(disallow)) rule.disallow = disallow;
      if (typeof crawlDelay === "number") rule.crawlDelay = crawlDelay;
      return rule as MetadataRoute.Robots["rules"];
    };

    let rules: MetadataRoute.Robots["rules"];
    if (Array.isArray(rulesBlock)) {
      const arr = rulesBlock.filter(isRecord).map(mapOne);
      rules = (
        arr.length ? arr : { userAgent: "*", allow: "/", disallow: ["/api/"] }
      ) as MetadataRoute.Robots["rules"];
    } else if (isRecord(rulesBlock)) {
      rules = mapOne(rulesBlock);
    } else {
      const fallbackDisallow = ["/api/", "/dashboard/", "/auth/", "/checkout", "/chat"];
      rules = { userAgent: "*", allow: "/", disallow: fallbackDisallow };
    }

    const out: MetadataRoute.Robots = { rules };
    if (sitemap) out.sitemap = sitemap;
    if (host) out.host = host;
    return { robots: out };
  }

  const text = await res.text().catch(() => "");
  const parsed = parseRobotsPlainText(text);
  return parsed ? { robots: parsed } : null;
}
