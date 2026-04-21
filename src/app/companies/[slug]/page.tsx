import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompanyDetail } from "@/components/companies/company-detail";
import { DealerDetailView } from "@/components/companies/dealer-detail-view";
import { companies, getCarsByCompanyId, getCompanyBySlug } from "@/data";
import { fetchDealerDetailPublic } from "@/lib/dealers/public-fetch";
import { isDealerIdParam } from "@/lib/dealers/normalize";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { SEO_ENTITY } from "@/lib/seo/seo-entity";
import { fetchSeoMeta, fetchSeoPage, fetchSeoStructuredData } from "@/lib/seo/seo-public-api";
import { mergeMetadata, seoMetaResponseToMetadata } from "@/lib/seo/seo-metadata";
import { collectJsonLdNodes } from "@/lib/seo/seo-jsonld";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = true;

export async function generateStaticParams() {
  return companies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (isDealerIdParam(slug)) {
    try {
      const d = await fetchDealerDetailPublic(slug);
      if (d?.dealer) {
        const fallback: Metadata = {
          title: `${d.dealer.name} — dealer profile`,
          description: `Contact, reviews, and verified details for ${d.dealer.name} on ${SITE_NAME}.`,
          alternates: { canonical: `${SITE_URL}/companies/${slug}` },
        };
        const seoRaw = await fetchSeoMeta(SEO_ENTITY.dealer, slug).catch(() => null);
        return mergeMetadata(fallback, seoMetaResponseToMetadata(seoRaw));
      }
    } catch {
      /* fall through */
    }
    return { title: "Dealer", robots: { index: false } };
  }
  const co = getCompanyBySlug(slug);
  if (!co) return { title: "Company" };
  const fallback: Metadata = {
    title: `${co.name} — dealer reviews & stock`,
    description: `${co.tagline} Browse ${co.listingsCount}+ listings in ${co.city}. Ratings, contact, and verified inventory on ${SITE_NAME}.`,
    keywords: `${co.name}, car dealer ${co.city}, used cars ${co.city}, ${SITE_NAME}`,
    alternates: { canonical: `${SITE_URL}/companies/${slug}` },
  };
  const seoRaw = await fetchSeoMeta(SEO_ENTITY.company, slug).catch(() => null);
  return mergeMetadata(fallback, seoMetaResponseToMetadata(seoRaw));
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;

  if (isDealerIdParam(slug)) {
    const initial = await fetchDealerDetailPublic(slug).catch(() => null);
    if (!initial?.dealer) notFound();
    const [pageSeo, structured] = await Promise.all([
      fetchSeoPage(SEO_ENTITY.dealer, slug).catch(() => null),
      fetchSeoStructuredData(SEO_ENTITY.dealer, slug).catch(() => null),
    ]);
    const jsonLdNodes = collectJsonLdNodes(structured, pageSeo);
    return (
      <>
        <SeoJsonLd nodes={jsonLdNodes} />
        <DealerDetailView dealerId={slug} initialData={initial} />
      </>
    );
  }

  const company = getCompanyBySlug(slug);
  if (!company) notFound();
  const stock = getCarsByCompanyId(company.id);
  const [pageSeo, structured] = await Promise.all([
    fetchSeoPage(SEO_ENTITY.company, slug).catch(() => null),
    fetchSeoStructuredData(SEO_ENTITY.company, slug).catch(() => null),
  ]);
  const jsonLdNodes = collectJsonLdNodes(structured, pageSeo);
  return (
    <>
      <SeoJsonLd nodes={jsonLdNodes} />
      <CompanyDetail company={company} stock={stock} />
    </>
  );
}
