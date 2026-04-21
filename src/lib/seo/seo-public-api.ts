const DEFAULT_BASE = "https://autolokate-api-staging-2j5tqz76xa-el.a.run.app";

function apiBase(): string {
  return (process.env.NEXT_PUBLIC_AUTOLOKATE_API_BASE_URL ?? DEFAULT_BASE).replace(/\/$/, "");
}

const REVALIDATE = 300;

function seoDisabled(): boolean {
  return process.env.SEO_API_DISABLED === "1" || process.env.SEO_API_DISABLED === "true";
}

/** Unwrap `{ success, data }` or `{ data }` envelopes. */
export function unwrapSeoPayload<T = unknown>(payload: unknown): T | null {
  if (payload == null) return null;
  if (typeof payload !== "object") return payload as T;
  const o = payload as Record<string, unknown>;
  if ("data" in o && o.data !== undefined) return o.data as T;
  return payload as T;
}

async function seoFetch(path: string, init?: RequestInit & { revalidate?: number | false }): Promise<Response> {
  const { revalidate = REVALIDATE, ...rest } = init ?? {};
  return fetch(`${apiBase()}${path}`, {
    ...rest,
    headers: {
      Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
      ...rest.headers,
    },
    next: revalidate === false ? { revalidate: 0 } : { revalidate },
  });
}

/** Composite SEO package — meta + structured data + breadcrumbs + FAQs + related. */
export async function fetchSeoPage(entityType: string, slug: string): Promise<unknown | null> {
  if (seoDisabled()) return null;
  const et = encodeURIComponent(entityType);
  const sl = encodeURIComponent(slug);
  const res = await seoFetch(`/v1/seo/page/${et}/${sl}`).catch(() => null);
  if (!res?.ok) return null;
  return res.json().catch(() => null);
}

/** Meta tags payload for a page (mapped to Next Metadata separately). */
export async function fetchSeoMeta(entityType: string, slug: string): Promise<unknown | null> {
  if (seoDisabled()) return null;
  const et = encodeURIComponent(entityType);
  const sl = encodeURIComponent(slug);
  const res = await seoFetch(`/v1/seo/meta/${et}/${sl}`).catch(() => null);
  if (!res?.ok) return null;
  return res.json().catch(() => null);
}

/** JSON-LD / structured data for an entity. */
export async function fetchSeoStructuredData(entityType: string, slug: string): Promise<unknown | null> {
  if (seoDisabled()) return null;
  const et = encodeURIComponent(entityType);
  const sl = encodeURIComponent(slug);
  const res = await seoFetch(`/v1/seo/structured-data/${et}/${sl}`).catch(() => null);
  if (!res?.ok) return null;
  return res.json().catch(() => null);
}

/** Sitemap index (all entity types). Raw JSON or text depending on API. */
export async function fetchSeoSitemapIndex(): Promise<unknown | null> {
  if (seoDisabled()) return null;
  const res = await seoFetch(`/v1/seo/sitemap`).catch(() => null);
  if (!res?.ok) return null;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("json")) return res.json().catch(() => null);
  return res.text().catch(() => null);
}

/** Paginated sitemap for an entity type (pass through query e.g. `?page=2`). */
export async function fetchSeoSitemapByType(
  type: string,
  query?: Record<string, string | number | undefined>
): Promise<Response | null> {
  if (seoDisabled()) return null;
  const q = new URLSearchParams();
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      q.set(k, String(v));
    }
  }
  const suffix = q.toString() ? `?${q.toString()}` : "";
  const res = await seoFetch(`/v1/seo/sitemap/${encodeURIComponent(type)}${suffix}`, {
    headers: { Accept: "application/xml, application/json;q=0.9, text/xml;q=0.8, */*;q=0.5" },
  }).catch(() => null);
  return res?.ok ? res : null;
}

export type SeoRedirectResult = {
  destination: string;
  permanent: boolean;
};

/** Lookup redirect for a site path (no leading slash in API segment is common). */
export async function fetchSeoRedirect(pathname: string): Promise<SeoRedirectResult | null> {
  if (seoDisabled()) return null;
  const pathKey = pathname.replace(/^\//, "") || "/";
  const res = await fetch(`${apiBase()}/v1/seo/redirects/${encodeURIComponent(pathKey)}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  }).catch(() => null);
  if (!res?.ok) return null;
  const json = (await res.json().catch(() => null)) as unknown;
  const raw = unwrapSeoPayload<Record<string, unknown>>(json);
  if (!raw || typeof raw !== "object") return null;
  const dest =
    (typeof raw.destination === "string" && raw.destination) ||
    (typeof raw.to === "string" && raw.to) ||
    (typeof raw.target === "string" && raw.target) ||
    (typeof raw.url === "string" && raw.url) ||
    null;
  if (!dest) return null;
  const permanent =
    raw.permanent === true ||
    raw.status === 301 ||
    raw.type === "permanent" ||
    (typeof raw.status_code === "number" && raw.status_code === 301);
  let destination = dest.trim();
  if (!destination.startsWith("http") && !destination.startsWith("/")) {
    destination = `/${destination}`;
  }
  return { destination, permanent };
}

/** Dynamic robots directives from API (JSON or plain robots.txt). */
export async function fetchSeoRobotsResponse(): Promise<Response | null> {
  if (seoDisabled()) return null;
  const res = await seoFetch(`/v1/seo/robots`, {
    headers: { Accept: "application/json, text/plain;q=0.9, */*;q=0.8" },
  }).catch(() => null);
  return res?.ok ? res : null;
}
