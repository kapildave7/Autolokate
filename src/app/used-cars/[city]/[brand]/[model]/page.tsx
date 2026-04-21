import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CarsGridSkeleton } from "@/components/cars/cars-grid-skeleton";
import { CarsPage } from "@/components/cars/cars-page";
import { resolveBrandFromSlug, resolveCityFromSlug, resolveModelFromSlug } from "@/lib/seo/resolvers";
import { carDetailPath } from "@/lib/seo/paths";
import { cars } from "@/data/cars";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { slugifyPart } from "@/lib/seo/slugs";

type Props = { params: Promise<{ city: string; brand: string; model: string }> };

export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, brand, model } = await params;
  const cityLabel = resolveCityFromSlug(city);
  const brandLabel = resolveBrandFromSlug(brand);
  const modelLabel = brandLabel ? resolveModelFromSlug(brandLabel, model) : null;
  if (!cityLabel || !brandLabel || !modelLabel) return { title: "Used cars", robots: { index: false } };
  const title = `Used ${brandLabel} ${modelLabel} in ${cityLabel} — Price, Mileage, Specs`;
  return {
    title,
    description: `Used ${brandLabel} ${modelLabel} listings in ${cityLabel}. Compare on-road price bands, mileage, fuel type, and ownership history on ${SITE_NAME}.`,
    keywords: `used ${brandLabel} ${modelLabel} ${cityLabel}, ${modelLabel} price ${cityLabel}, second hand ${modelLabel}`,
    alternates: {
      canonical: `${SITE_URL}/used-cars/${city}/${slugifyPart(brandLabel)}/${slugifyPart(modelLabel)}`,
    },
  };
}

export default async function UsedCarsCityBrandModelPage({ params }: Props) {
  const { city, brand, model } = await params;
  const cityLabel = resolveCityFromSlug(city);
  const brandLabel = resolveBrandFromSlug(brand);
  const modelLabel = brandLabel ? resolveModelFromSlug(brandLabel, model) : null;
  if (!cityLabel || !brandLabel || !modelLabel) notFound();

  const listings = cars.filter(
    (c) => c.city === cityLabel && c.brand === brandLabel && c.model === modelLabel && !c.isNew
  );

  return (
    <Suspense fallback={<CarsFallback />}>
      <div className="border-b border-border bg-secondary/20">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-foreground">Jump to a listing</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {listings.slice(0, 12).map((c) => (
              <li key={c.id}>
                <Link
                  href={carDetailPath(c)}
                  className="inline-flex rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/35 hover:text-primary"
                >
                  {c.variant} · {c.year}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <CarsPage
        pathBase={`/used-cars/${city}/${brand}/${model}`}
        lockedFilters={{ city: cityLabel, brand: brandLabel, model: modelLabel, isNew: false }}
        pageTitle={`Used ${brandLabel} ${modelLabel} in ${cityLabel}`}
        pageSubtitle={`${listings.length} listings · compare price, mileage, features, and seller type.`}
        intro={
          <p>
            Each vehicle resolves to a single canonical URL under{" "}
            <span className="font-mono text-primary">/cars/brand-model-year-city-id</span> for consistent
            indexing.
          </p>
        }
      />
    </Suspense>
  );
}

function CarsFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-8 w-80 animate-pulse rounded-lg bg-muted/50" />
      <div className="mt-10">
        <CarsGridSkeleton />
      </div>
    </div>
  );
}
