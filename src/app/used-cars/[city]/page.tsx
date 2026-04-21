import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { brands, indianCities } from "@/data";
import { CarsGridSkeleton } from "@/components/cars/cars-grid-skeleton";
import { CarsPage } from "@/components/cars/cars-page";
import { cityToSlug, resolveCityFromSlug } from "@/lib/seo/resolvers";
import { usedCarsCityBrandPath } from "@/lib/seo/paths";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";

type Props = { params: Promise<{ city: string }> };

export async function generateStaticParams() {
  return indianCities.map((c) => ({ city: cityToSlug(c) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const label = resolveCityFromSlug(city);
  if (!label) return { title: "Used cars", robots: { index: false } };
  const title = `Used Cars in ${label} — Buy Second Hand Cars at Best Price`;
  return {
    title,
    description: `Browse verified used cars in ${label}. Check prices, mileage, specs, features, and seller ratings. Book a test drive on ${SITE_NAME}.`,
    keywords: `used cars ${label}, second hand cars ${label}, pre-owned cars ${label}, ${label} car market, ${SITE_NAME}`,
    alternates: { canonical: `${SITE_URL}/used-cars/${city}` },
  };
}

export default async function UsedCarsCityPage({ params }: Props) {
  const { city } = await params;
  const label = resolveCityFromSlug(city);
  if (!label) notFound();

  return (
    <Suspense fallback={<CarsFallback />}>
      <div className="border-b border-border bg-secondary/20">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-foreground">Popular brands in {label}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {brands.slice(0, 16).map((b) => (
              <li key={b}>
                <Link
                  href={usedCarsCityBrandPath(label, b)}
                  className="inline-flex rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/35 hover:text-primary"
                >
                  {b}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <CarsPage
        pathBase={`/used-cars/${city}`}
        lockedFilters={{ city: label, isNew: false }}
        pageTitle={`Used cars in ${label}`}
        pageSubtitle={`Second-hand and certified listings in ${label}. Compare EMI, mileage, and features.`}
        intro={
          <p>
            Explore all{" "}
            <Link href="/used-cars" className="text-primary hover:underline">
              used cars in India
            </Link>{" "}
            or browse{" "}
            <Link href="/new-cars" className="text-primary hover:underline">
              new cars
            </Link>
            .
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
