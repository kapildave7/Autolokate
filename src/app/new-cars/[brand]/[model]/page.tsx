import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { cars } from "@/data/cars";
import { CarsGridSkeleton } from "@/components/cars/cars-grid-skeleton";
import { CarsPage } from "@/components/cars/cars-page";
import { resolveBrandFromSlug, resolveModelFromSlug } from "@/lib/seo/resolvers";
import { newCarsVariantPath } from "@/lib/seo/paths";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { slugifyPart } from "@/lib/seo/slugs";

type Props = { params: Promise<{ brand: string; model: string }> };

export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand, model } = await params;
  const brandLabel = resolveBrandFromSlug(brand);
  const modelLabel = brandLabel ? resolveModelFromSlug(brandLabel, model) : null;
  if (!brandLabel || !modelLabel) return { title: "New cars", robots: { index: false } };
  const title = `New ${brandLabel} ${modelLabel} — Price, Variants, Mileage`;
  return {
    title,
    description: `New ${brandLabel} ${modelLabel} in India: variants, features, mileage, and price guidance on ${SITE_NAME}.`,
    keywords: `new ${brandLabel} ${modelLabel}, ${modelLabel} price India, ${modelLabel} variants`,
    alternates: {
      canonical: `${SITE_URL}/new-cars/${slugifyPart(brandLabel)}/${slugifyPart(modelLabel)}`,
    },
  };
}

export default async function NewCarsBrandModelPage({ params }: Props) {
  const { brand, model } = await params;
  const brandLabel = resolveBrandFromSlug(brand);
  const modelLabel = brandLabel ? resolveModelFromSlug(brandLabel, model) : null;
  if (!brandLabel || !modelLabel) notFound();

  const variants = [
    ...new Set(
      cars.filter((c) => c.brand === brandLabel && c.model === modelLabel && c.isNew).map((c) => c.variant)
    ),
  ].sort();

  return (
    <Suspense fallback={<CarsFallback />}>
      <div className="border-b border-border bg-secondary/20">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-foreground">Variants</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {variants.map((v) => (
              <li key={v}>
                <Link
                  href={newCarsVariantPath(brandLabel, modelLabel, v)}
                  className="inline-flex max-w-full rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/35 hover:text-primary"
                >
                  <span className="truncate">{v}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <CarsPage
        pathBase={`/new-cars/${brand}/${model}`}
        lockedFilters={{ brand: brandLabel, model: modelLabel, isNew: true }}
        pageTitle={`New ${brandLabel} ${modelLabel}`}
        pageSubtitle="Pick a variant for exact specs, features, and pricing."
        intro={
          <p>
            <Link href={`/new-cars/${slugifyPart(brandLabel)}`} className="text-primary hover:underline">
              All new {brandLabel}
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
