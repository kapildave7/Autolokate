/** Canonical origin for sitemaps, Open Graph, and JSON-LD. Override in production via env. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://www.autolokate.com";

export const SITE_NAME = "Autolokate";
