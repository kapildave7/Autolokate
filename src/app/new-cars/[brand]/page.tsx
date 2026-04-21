import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { cars } from "@/data/cars";
import { CarsGridSkeleton } from "@/components/cars/cars-grid-skeleton";
import { CarsPage } from "@/components/cars/cars-page";
import { resolveBrandFromSlug } from "@/lib/seo/resolvers";
import { newCarsBrandModelPath } from "@/lib/seo/paths";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { slugifyPart } from "@/lib/seo/slugs";

type Props = { params: Promise<{ brand: string }> };

export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand } = await params;
  const brandLabel = resolveBrandFromSlug(brand);
  if (!brandLabel) return { title: "New cars", robots: { index: false } };
  const title = `New ${brandLabel} Cars in India — Models, Prices`;
  return {
    title,
    description: `Browse new ${brandLabel} cars in India. Compare models, variants, mileage, features, and price bands on ${SITE_NAME}.`,
    keywords: `new ${brandLabel} cars, ${brandLabel} models India, ${brandLabel} price list`,
    alternates: { canonical: `${SITE_URL}/new-cars/${slugifyPart(brandLabel)}` },
  };
}

export default async function NewCarsBrandPage({ params }: Props) {
  const { brand } = await params;
  const brandLabel = resolveBrandFromSlug(brand);
  if (!brandLabel) notFound();

  const models = [
    ...new Set(cars.filter((c) => c.brand === brandLabel && c.isNew).map((c) => c.model)),
  ].sort();

  return (
    <Suspense fallback={<CarsFallback />}>
      <div className="border-b border-border bg-secondary/20">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-foreground">{brandLabel} models</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {models.map((m) => (
              <li key={m}>
                <Link
                  href={newCarsBrandModelPath(brandLabel, m)}
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
        pathBase={`/new-cars/${brand}`}
        lockedFilters={{ brand: brandLabel, isNew: true }}
        pageTitle={`New ${brandLabel} cars`}
        pageSubtitle="Latest variants with specs, mileage, and transparent list pricing."
        intro={
          <p>
            <Link href="/new-cars" className="text-primary hover:underline">
              All new cars
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
      <div className="h-8 w-64 animate-pulse rounded-lg bg-muted/50" />
      <div className="mt-10">
        <CarsGridSkeleton />
      </div>
    </div>
  );
}
