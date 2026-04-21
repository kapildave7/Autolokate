import type { NextRequest } from "next/server";
import { fetchSeoSitemapByType } from "@/lib/seo/seo-public-api";

/**
 * Proxies `GET /v1/seo/sitemap/{type}` (XML or JSON) for crawlers and manual inspection.
 * Example: `/seo/sitemap/model?page=1`
 */
export async function GET(request: NextRequest, context: { params: Promise<{ type: string }> }) {
  const { type } = await context.params;
  const qs = Object.fromEntries(request.nextUrl.searchParams.entries());
  const res = await fetchSeoSitemapByType(type, qs);
  if (!res) return new Response("Not found", { status: 404 });
  const body = await res.text();
  const ct = res.headers.get("content-type") ?? "application/xml";
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": ct,
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
