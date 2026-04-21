import type { Metadata } from "next";
import { DiscoveryHome } from "@/components/discovery/discovery-home";
import { JsonLdScript } from "@/components/seo/json-ld";
import { cars } from "@/data";
import { buildCarListingSlug } from "@/lib/seo/slugs";
import { SITE_URL } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Autolokate AI Car Discovery Platform",
  description:
    "Autolokate is a production-ready car discovery platform with AI-guided shortlisting, comparison, and expert consultation booking.",
  keywords:
    "Autolokate, AI car discovery, car comparison India, car recommendation engine, expert consultation",
  alternates: {
    canonical: `${SITE_URL}/`,
  },
  openGraph: {
    title: "Autolokate AI Car Discovery Platform",
    description:
      "Find the right car with AI prompts, rich detail pages, side-by-side comparison, and expert consultations.",
    url: `${SITE_URL}/`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Autolokate AI Car Discovery Platform",
    description: "AI-first car discovery and compare experience built for confident buying decisions.",
  },
};

export default function HomePage() {
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Recommended cars",
    itemListElement: cars.slice(0, 12).map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/cars/${buildCarListingSlug(c)}`,
      name: `${c.brand} ${c.model} ${c.variant}`,
    })),
  };
  return (
    <>
      <JsonLdScript data={itemListSchema} />
      <DiscoveryHome />
    </>
  );
}
