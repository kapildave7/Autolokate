import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";
import { parseSeoRobotsResponse } from "@/lib/seo/seo-metadata";
import { fetchSeoRobotsResponse } from "@/lib/seo/seo-public-api";

const defaultRobots: MetadataRoute.Robots = {
  rules: {
    userAgent: "*",
    allow: "/",
    disallow: ["/api/", "/dashboard/", "/auth/", "/checkout", "/chat"],
  },
  sitemap: `${SITE_URL}/sitemap.xml`,
};

/** Merges `GET /v1/seo/robots` when available; always ensures a sitemap URL. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const res = await fetchSeoRobotsResponse().catch(() => null);
  if (res) {
    const parsed = await parseSeoRobotsResponse(res).catch(() => null);
    if (parsed?.robots) {
      const r = parsed.robots;
      return {
        ...r,
        sitemap: r.sitemap ?? `${SITE_URL}/sitemap.xml`,
      };
    }
  }
  return defaultRobots;
}
