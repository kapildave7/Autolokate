import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { cars } from "@/data/cars";
import { CarsGridSkeleton } from "@/components/cars/cars-grid-skeleton";
import { CarsPage } from "@/components/cars/cars-page";
import { cityToSlug, resolveBrandFromSlug, resolveCityFromSlug } from "@/lib/seo/resolvers";
import { usedCarsCityBrandModelPath } from "@/lib/seo/paths";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { slugifyPart } from "@/lib/seo/slugs";

type Props = { params: Promise<{ city: string; brand: string }> };

export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, brand } = await params;
  const cityLabel = resolveCityFromSlug(city);
  const brandLabel = resolveBrandFromSlug(brand);
  if (!cityLabel || !brandLabel) return { title: "Used cars", robots: { index: false } };
  const title = `Used ${brandLabel} Cars in ${cityLabel} — Prices & Listings`;
  return {
    title,
    description: `Find used ${brandLabel} cars in ${cityLabel}. Compare prices, mileage, variants, and book a test drive on ${SITE_NAME}.`,
    keywords: `used ${brandLabel} ${cityLabel}, second hand ${brandLabel}, ${brandLabel} price ${cityLabel}`,
    alternates: {
      canonical: `${SITE_URL}/used-cars/${city}/${slugifyPart(brandLabel)}`,
    },
  };
}

export default async function UsedCarsCityBrandPage({ params }: Props) {
  const { city, brand } = await params;
  const cityLabel = resolveCityFromSlug(city);
  const brandLabel = resolveBrandFromSlug(brand);
  if (!cityLabel || !brandLabel) notFound();

  const models = [
    ...new Set(cars.filter((c) => c.city === cityLabel && c.brand === brandLabel).map((c) => c.model)),
  ].sort();

  return (
    <Suspense fallback={<CarsFallback />}>
      <div className="border-b border-border bg-secondary/20">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-foreground">
            {brandLabel} models in {cityLabel}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {models.map((m) => (
              <li key={m}>
                <Link
                  href={usedCarsCityBrandModelPath(cityLabel, brandLabel, m)}
                  className="inline-flex rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/35 hover:text-primary"
                >
                  {m}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <CarsPage
        pathBase={`/used-cars/${city}/${brand}`}
        lockedFilters={{ city: cityLabel, brand: brandLabel, isNew: false }}
        pageTitle={`Used ${brandLabel} in ${cityLabel}`}
        pageSubtitle={`Browse verified ${brandLabel} listings with specs, mileage, and transparent pricing.`}
        intro={
          <p>
            <Link href={`/used-cars/${cityToSlug(cityLabel)}`} className="text-primary hover:underline">
              All used cars in {cityLabel}
            </Link>
            {" · "}
            <Link href="/used-cars" className="text-primary hover:underline">
              India hub
            </Link>
          </p>
        }
      />
    </Suspense>
  );
}

function CarsFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-8 w-72 animate-pulse rounded-lg bg-muted/50" />
      <div className="mt-10">
        <CarsGridSkeleton />
      </div>
    </div>
  );
}
