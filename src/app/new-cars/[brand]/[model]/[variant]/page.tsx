import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { cars } from "@/data/cars";
import { CarsGridSkeleton } from "@/components/cars/cars-grid-skeleton";
import { CarsPage } from "@/components/cars/cars-page";
import { resolveBrandFromSlug, resolveModelFromSlug, resolveVariantFromSlug } from "@/lib/seo/resolvers";
import { carDetailPath } from "@/lib/seo/paths";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { slugifyPart } from "@/lib/seo/slugs";

type Props = { params: Promise<{ brand: string; model: string; variant: string }> };

export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand, model, variant } = await params;
  const brandLabel = resolveBrandFromSlug(brand);
  const modelLabel = brandLabel ? resolveModelFromSlug(brandLabel, model) : null;
  const variantLabel =
    brandLabel && modelLabel ? resolveVariantFromSlug(brandLabel, modelLabel, variant) : null;
  if (!brandLabel || !modelLabel || !variantLabel) return { title: "New cars", robots: { index: false } };
  const title = `New ${brandLabel} ${modelLabel} ${variantLabel} — Price & Specs`;
  return {
    title,
    description: `New ${brandLabel} ${modelLabel} ${variantLabel}: features, mileage, and listings on ${SITE_NAME}.`,
    keywords: `${brandLabel} ${modelLabel} ${variantLabel}, new car price India`,
    alternates: {
      canonical: `${SITE_URL}/new-cars/${slugifyPart(brandLabel)}/${slugifyPart(modelLabel)}/${slugifyPart(variantLabel)}`,
    },
  };
}

export default async function NewCarsVariantPage({ params }: Props) {
  const { brand, model, variant } = await params;
  const brandLabel = resolveBrandFromSlug(brand);
  const modelLabel = brandLabel ? resolveModelFromSlug(brandLabel, model) : null;
  const variantLabel =
    brandLabel && modelLabel ? resolveVariantFromSlug(brandLabel, modelLabel, variant) : null;
  if (!brandLabel || !modelLabel || !variantLabel) notFound();

  const listings = cars.filter(
    (c) =>
      c.brand === brandLabel && c.model === modelLabel && c.variant === variantLabel && c.isNew
  );

  return (
    <Suspense fallback={<CarsFallback />}>
      <div className="border-b border-border bg-secondary/20">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-foreground">Live listings</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {listings.slice(0, 12).map((c) => (
              <li key={c.id}>
                <Link
                  href={carDetailPath(c)}
                  className="inline-flex rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/35 hover:text-primary"
                >
                  {c.city} · {formatInrShort(c.price)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <CarsPage
        pathBase={`/new-cars/${brand}/${model}/${variant}`}
        lockedFilters={{
          brand: brandLabel,
          model: modelLabel,
          variant: variantLabel,
          isNew: true,
        }}
        pageTitle={`New ${brandLabel} ${modelLabel} ${variantLabel}`}
        pageSubtitle={`${listings.length} matching new listings across cities.`}
        intro={
          <p>
            <Link href={`/new-cars/${brand}/${model}`} className="text-primary hover:underline">
              All variants of {modelLabel}
            </Link>
          </p>
        }
      />
    </Suspense>
  );
}

function formatInrShort(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
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
