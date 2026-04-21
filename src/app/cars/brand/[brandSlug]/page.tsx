import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CarsPageApi } from "@/components/cars/cars-page-api";
import { CarsGridSkeleton } from "@/components/cars/cars-grid-skeleton";
import { PageFade } from "@/components/shared/page-fade";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { slugifyPart } from "@/lib/seo/slugs";

type Props = { params: Promise<{ brandSlug: string }> };

const API_BASE_URL = (process.env.NEXT_PUBLIC_AUTOLOKATE_API_BASE_URL ??
  "https://autolokate-api-staging-2j5tqz76xa-el.a.run.app").replace(/\/$/, "");

async function fetchBrandDetailsServer(brandSlug: string): Promise<unknown | null> {
  const response = await fetch(`${API_BASE_URL}/v1/catalogue/brands/${encodeURIComponent(brandSlug)}`, {
    next: { revalidate: 60 },
  });
  if (!response.ok) return null;
  const json = (await response.json().catch(() => null)) as { data?: unknown } | null;
  return json?.data ?? null;
}

function readBrandName(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const maybe = payload as Record<string, unknown>;
  const name = maybe.brand_name ?? maybe.name ?? maybe.title;
  return typeof name === "string" && name.trim() ? name.trim() : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brandSlug } = await params;
  const brandDetails = await fetchBrandDetailsServer(brandSlug);
  const brand = readBrandName(brandDetails);
  if (!brand) return { title: "Brand not found", robots: { index: false } };
  const title = `${brand} cars for sale — browse live listings`;
  const description = `Shop every ${brand} listing on ${SITE_NAME}: filter by city, price, fuel, body type, EMI, and more.`;
  const canonical = `${SITE_URL}/cars/brand/${slugifyPart(brand)}`;
  return {
    title,
    description,
    keywords: `${brand} used cars, ${brand} new cars India, ${brand} price, buy ${brand} car`,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

function CarsBrandFallback() {
  return (
    <PageFade>
      <div className="border-b border-border bg-linear-to-b from-secondary/60 to-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-muted/60" />
          <div className="mt-4 h-12 w-full max-w-lg animate-pulse rounded-lg bg-muted/40" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <CarsGridSkeleton />
      </div>
    </PageFade>
  );
}

export default async function CarBrandListingPage({ params }: Props) {
  const { brandSlug } = await params;
  const brandDetails = await fetchBrandDetailsServer(brandSlug);
  const brand = readBrandName(brandDetails);
  if (!brand) notFound();

  return (
    <Suspense fallback={<CarsBrandFallback />}>
      <CarsPageApi
        pageTitle={`${brand} cars`}
        pageSubtitle="This brand’s models from the live catalogue — same search, filters, and sorting as the full inventory."
        lockedBrand={brand}
      />
    </Suspense>
  );
}
