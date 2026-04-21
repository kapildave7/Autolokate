import type { Metadata } from "next";
import { CompareLegacySlugRedirect } from "@/components/compare/compare-legacy-slug-redirect";
import { parseCompareSlug } from "@/lib/seo/slugs";
import { SITE_NAME } from "@/lib/seo/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ids = parseCompareSlug(slug);
  if (ids.length < 2) {
    return {
      title: "Compare cars",
      description: `Compare up to three vehicles side by side on ${SITE_NAME}.`,
    };
  }
  return {
    title: "Compare cars",
    description: `Compare ${ids.length} vehicles side by side — ${SITE_NAME}.`,
    robots: { index: false },
  };
}

/** Legacy path segments like `car-1-vs-car-2` — redirected client-side to `?ids=` with resolved variant IDs. */
export default async function CompareSlugPage({ params }: Props) {
  const { slug } = await params;
  const ids = parseCompareSlug(slug);
  if (ids.length < 2) {
    const { redirect } = await import("next/navigation");
    redirect("/compare");
  }
  return <CompareLegacySlugRedirect slug={slug} />;
}
