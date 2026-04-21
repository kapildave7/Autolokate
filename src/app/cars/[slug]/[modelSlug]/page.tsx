import type { Metadata } from "next";
import { LiveModelDetailLoader } from "@/components/cars/live-model-detail-loader";
import { SEO_ENTITY } from "@/lib/seo/seo-entity";
import { fetchSeoMeta } from "@/lib/seo/seo-public-api";
import { mergeMetadata, seoMetaResponseToMetadata } from "@/lib/seo/seo-metadata";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";

type Props = { params: Promise<{ slug: string; modelSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, modelSlug } = await params;
  const title = `${modelSlug.replace(/-/g, " ")} price, specs and variants | ${SITE_NAME}`;
  const description = `Explore ${modelSlug.replace(/-/g, " ")} model details, variants, features, and latest pricing on ${SITE_NAME}.`;
  const canonical = `${SITE_URL}/cars/${encodeURIComponent(slug)}/${encodeURIComponent(modelSlug)}`;
  const fallback: Metadata = {
    title,
    description,
    keywords: `${title.replace(` | ${SITE_NAME}`, "")}, model details India`,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: { title, description, url: canonical, type: "website", locale: "en_IN", siteName: SITE_NAME },
    twitter: { card: "summary_large_image", title, description },
  };
  const seoRaw = await fetchSeoMeta(SEO_ENTITY.model, modelSlug).catch(() => null);
  const fromApi = seoMetaResponseToMetadata(seoRaw);
  return mergeMetadata(fallback, fromApi);
}

export default async function CarDetailByBrandPage({ params }: Props) {
  const { slug, modelSlug } = await params;
  return <LiveModelDetailLoader brandSlug={slug} modelSlug={modelSlug} />;
}
