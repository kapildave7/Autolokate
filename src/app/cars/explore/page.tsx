import type { Metadata } from "next";
import { Suspense } from "react";
import { CarsPageApi } from "@/components/cars/cars-page-api";
import { CarsGridSkeleton } from "@/components/cars/cars-grid-skeleton";
import { PageFade } from "@/components/shared/page-fade";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Explore all cars — mixed discovery",
  description: `Browse a curated mix of every brand on ${SITE_NAME}. Full filters, sort, grid or list — discover cars beyond the default newest-first order.`,
  keywords: "explore cars, mixed car listings, browse all brands, car discovery India, Autolokate",
  alternates: { canonical: `${SITE_URL}/cars/explore` },
  openGraph: {
    title: `Explore all cars — ${SITE_NAME}`,
    description: "A mixed, discovery-first pass through the full catalog with every filter and sort option.",
    url: `${SITE_URL}/cars/explore`,
    type: "website",
  },
};

function CarsExploreFallback() {
  return (
    <PageFade>
        <div className="border-b border-border bg-linear-to-b from-secondary/60 to-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-muted/60" />
          <div className="mt-4 h-12 w-full max-w-xl animate-pulse rounded-lg bg-muted/40" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <CarsGridSkeleton />
      </div>
    </PageFade>
  );
}

export default function CarsExplorePage() {
  return (
    <Suspense fallback={<CarsExploreFallback />}>
      <CarsPageApi
        pageTitle="Explore all cars"
        pageSubtitle="Discovery-first pass through the catalogue — search, filter by body and fuel, and sort by price or curated mix."
        discoverySort
      />
    </Suspense>
  );
}
