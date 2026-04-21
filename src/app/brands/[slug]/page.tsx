import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "@/data";
import { Card, CardContent } from "@/components/ui/card";
import { PageFade } from "@/components/shared/page-fade";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { BrandLogo } from "@/components/brands/brand-logo";
import { slugifyPart } from "@/lib/seo/slugs";
import { RemoteImageWithFallback } from "@/components/ui/remote-image";
import { exteriorFallbackForKey } from "@/lib/fallback-images";
import { SEO_ENTITY } from "@/lib/seo/seo-entity";
import { fetchSeoMeta, fetchSeoPage, fetchSeoStructuredData } from "@/lib/seo/seo-public-api";
import { mergeMetadata, seoMetaResponseToMetadata } from "@/lib/seo/seo-metadata";
import { collectJsonLdNodes } from "@/lib/seo/seo-jsonld";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";

type Props = { params: Promise<{ slug: string }> };

const API_BASE_URL = (process.env.NEXT_PUBLIC_AUTOLOKATE_API_BASE_URL ??
  "https://autolokate-api-staging-2j5tqz76xa-el.a.run.app").replace(/\/$/, "");

async function fetchBrandDetailsServer(slug: string): Promise<unknown | null> {
  const response = await fetch(`${API_BASE_URL}/v1/catalogue/brands/${encodeURIComponent(slug)}`, {
    next: { revalidate: 60 },
  });
  if (!response.ok) return null;
  const json = (await response.json().catch(() => null)) as { data?: unknown } | null;
  return json?.data ?? null;
}

async function fetchBrandModelsServer(slug: string): Promise<unknown[]> {
  const response = await fetch(`${API_BASE_URL}/v1/catalogue/brands/${encodeURIComponent(slug)}/models`, {
    next: { revalidate: 60 },
  });
  if (!response.ok) return [];
  const json = (await response.json().catch(() => null)) as { data?: unknown[] } | null;
  return Array.isArray(json?.data) ? json.data : [];
}

type BrandDetails = {
  name?: string;
  brand_name?: string;
  title?: string;
  vehicle_category?: string;
};

type BrandModel = {
  id?: string;
  slug?: string;
  name?: string;
  model_name?: string;
  body_type?: string;
  fuel_types?: string[];
  fuel_type?: string;
  min_price?: number;
  max_price?: number;
  starting_price?: number;
  hero_image_url?: string;
  brand?: { name?: string; slug?: string };
};

function normalizeBrandModel(payload: unknown): BrandModel {
  if (!payload || typeof payload !== "object") return {};
  const row = payload as Record<string, unknown>;
  const fuelTypes = Array.isArray(row.fuel_types) ? (row.fuel_types as string[]) : [];
  return {
    ...(row as BrandModel),
    model_name: (row.model_name as string | undefined) ?? (row.name as string | undefined),
    fuel_type: (row.fuel_type as string | undefined) ?? fuelTypes[0],
    starting_price:
      typeof row.starting_price === "number"
        ? row.starting_price
        : typeof row.min_price === "number"
          ? row.min_price
          : undefined,
    min_price:
      typeof row.min_price === "number"
        ? row.min_price
        : typeof row.starting_price === "number"
          ? row.starting_price
          : undefined,
    max_price: typeof row.max_price === "number" ? row.max_price : undefined,
    hero_image_url:
      (row.hero_image_url as string | undefined) ??
      (row.image_url as string | undefined) ??
      (row.thumbnail_url as string | undefined),
  };
}

function pickBrandName(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const details = payload as BrandDetails;
  const name = details.brand_name ?? details.name ?? details.title;
  return typeof name === "string" && name.trim() ? name.trim() : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const details = await fetchBrandDetailsServer(slug);
  const brandName = pickBrandName(details);
  if (!brandName) return { title: "Brand not found", robots: { index: false } };
  const fallback: Metadata = {
    title: `${brandName} models, specs and stories`,
    description: `Explore ${brandName} on ${SITE_NAME}: live model line-up, specs, and editorial stories.`,
    alternates: { canonical: `${SITE_URL}/brands/${slug}` },
  };
  const seoRaw = await fetchSeoMeta(SEO_ENTITY.brand, slug).catch(() => null);
  return mergeMetadata(fallback, seoMetaResponseToMetadata(seoRaw));
}

export default async function BrandDetailPage({ params }: Props) {
  const { slug } = await params;
  const details = await fetchBrandDetailsServer(slug);
  const brandName = pickBrandName(details);
  if (!brandName) notFound();
  const [pageSeo, structured] = await Promise.all([
    fetchSeoPage(SEO_ENTITY.brand, slug).catch(() => null),
    fetchSeoStructuredData(SEO_ENTITY.brand, slug).catch(() => null),
  ]);
  const jsonLdNodes = collectJsonLdNodes(structured, pageSeo);
  const models = (await fetchBrandModelsServer(slug)).map(normalizeBrandModel);
  const colors = Array.from(new Set(models.map((m) => String(m.body_type ?? "").trim()).filter(Boolean))).slice(
    0,
    18
  );
  const stories = blogPosts
    .filter((p) => new RegExp(brandName.replace(/\s+/g, "|"), "i").test(`${p.title} ${p.excerpt}`))
    .slice(0, 6);

  return (
    <PageFade>
      <SeoJsonLd nodes={jsonLdNodes} />
      <section className="border-b border-border bg-hero-mesh">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <BrandLogo brand={brandName} size={36} variant="wordmark" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Brand hub</p>
              <h1 className="font-display text-4xl text-foreground sm:text-5xl">{brandName}</h1>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-sm text-muted-foreground sm:text-base">
            Model-by-model discovery with colors, specs, and editorial context in one SEO-friendly destination page.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-border bg-white px-3 py-1 text-xs text-muted-foreground">
              {models.length} model listings
            </span>
            <span className="rounded-full border border-border bg-white px-3 py-1 text-xs text-muted-foreground">
              {colors.length} known body styles
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-xl font-semibold text-foreground">Models and variants</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {models.slice(0, 12).map((model) => (
            <Link key={model.id ?? model.slug ?? model.model_name} href={model.slug ? `/cars/${model.slug}` : "/cars/explore"}>
              <Card className="card-hover-premium border-border bg-card">
                <div className="relative h-40 w-full overflow-hidden rounded-t-xl bg-muted/40">
                  <RemoteImageWithFallback
                    src={model.hero_image_url ?? exteriorFallbackForKey(String(model.slug ?? model.id ?? model.model_name ?? "car"))}
                    alt={`${brandName} ${model.model_name ?? "Model"}`}
                    fill
                    className="object-cover"
                    sizes="(max-width:1024px) 100vw, 33vw"
                  />
                </div>
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-foreground">
                    {brandName} {model.model_name ?? "Model"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {model.body_type ?? "Body"} ·{" "}
                    {model.fuel_type ??
                      (Array.isArray(model.fuel_types) && model.fuel_types.length ? model.fuel_types.join(", ") : "Fuel")}
                  </p>
                  <p className="mt-2 text-xs text-primary">
                    {typeof model.starting_price === "number"
                      ? `Starting at ₹${model.starting_price.toLocaleString("en-IN")}`
                      : "Price on request"}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {typeof model.max_price === "number" ? `Up to ₹${model.max_price.toLocaleString("en-IN")}` : "Ex-showroom"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <Link
          href={`/cars/brand/${slugifyPart(brandName)}`}
          className="mt-6 inline-flex text-sm font-semibold text-primary hover:underline"
        >
          Open live listing page for {brandName}
        </Link>
      </section>

      <section className="border-t border-border bg-[#f8fafc]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-foreground">Color choices</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {colors.length ? colors.map((color) => (
              <span key={color} className="rounded-full border border-border bg-white px-3 py-1 text-xs text-muted-foreground">
                {color}
              </span>
            )) : <span className="text-sm text-muted-foreground">Body type catalog will expand as data grows.</span>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-xl font-semibold text-foreground">Related stories</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {(stories.length ? stories : blogPosts.slice(0, 3)).map((story) => (
            <Link key={story.slug} href={`/blog/${story.slug}`}>
              <Card className="card-hover-premium h-full border-border bg-card">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">{story.category}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{story.title}</p>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{story.excerpt}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </PageFade>
  );
}
