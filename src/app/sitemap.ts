import type { MetadataRoute } from "next";
import { articles, bikes, companies } from "@/data";
import { cars } from "@/data/cars";
import { buildCarListingSlug } from "@/lib/seo/slugs";
import { SITE_URL } from "@/lib/seo/site";
import { bikePath } from "@/lib/seo/bike-paths";
import { FEATURE_FLAGS } from "@/lib/features";
import { curatedBrands, curatedBrandSlug } from "@/lib/brands-curated";
import { fetchSeoSitemapIndex } from "@/lib/seo/seo-public-api";
import { dedupeSitemapByUrl, seoSitemapPayloadToEntries } from "@/lib/seo/seo-sitemap-merge";

function buildStaticSitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const base = SITE_URL;

  const out: MetadataRoute.Sitemap = [];

  const push = (
    path: string,
    priority = 0.7,
    changeFrequency: NonNullable<MetadataRoute.Sitemap[0]["changeFrequency"]> = "weekly"
  ) => {
    out.push({ url: `${base}${path}`, lastModified, changeFrequency, priority });
  };

  push("/", 1, "daily");
  push("/compare", 0.95, "weekly");
  push("/cars", 0.92, "daily");
  push("/cars/explore", 0.88, "daily");
  push("/book-expert", 0.78, "weekly");
  push("/bikes", 0.8, "weekly");
  push("/test-drive", 0.75, "weekly");
  push("/community", 0.65, "weekly");
  push("/blog", 0.85, "daily");
  push("/brands", 0.82, "weekly");
  push("/media", 0.85, "daily");
  push("/media/news", 0.72, "weekly");
  push("/media/reviews", 0.72, "weekly");
  push("/media/comparison", 0.72, "weekly");
  if (FEATURE_FLAGS.dealersEnabled) push("/companies", 0.8, "weekly");
  push("/about", 0.45, "monthly");
  push("/shop", 0.55, "weekly");
  push("/shipping-policy", 0.4, "monthly");
  push("/contact", 0.45, "monthly");
  push("/support", 0.5, "monthly");
  push("/privacy", 0.4, "monthly");
  push("/terms", 0.4, "monthly");
  push("/refund-policy", 0.4, "monthly");
  push("/status", 0.25, "monthly");

  for (const car of cars) {
    push(`/cars/${buildCarListingSlug(car)}`, 0.9, "weekly");
  }

  for (const a of articles) {
    push(`/blog/${a.slug}`, 0.72, "weekly");
    push(`/media/${a.slug}`, 0.55, "weekly");
  }

  for (const b of bikes) {
    push(bikePath(b), 0.72, "weekly");
  }

  if (FEATURE_FLAGS.dealersEnabled) {
    for (const co of companies) {
      push(`/companies/${co.slug}`, 0.74, "weekly");
    }
  }
  for (const brand of curatedBrands) {
    push(`/brands/${curatedBrandSlug(brand.name)}`, 0.76, "weekly");
  }

  return out;
}

/** Static routes plus URLs from `GET /v1/seo/sitemap` when JSON-shaped. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = buildStaticSitemap();
  const raw = await fetchSeoSitemapIndex().catch(() => null);
  const apiEntries =
    typeof raw === "string" ? ([] as MetadataRoute.Sitemap) : seoSitemapPayloadToEntries(raw);
  return dedupeSitemapByUrl([...apiEntries, ...staticEntries]);
}
