import type { Metadata } from "next";
import { Suspense } from "react";
import { CarsPageApi } from "@/components/cars/cars-page-api";
import { CarsGridSkeleton } from "@/components/cars/cars-grid-skeleton";
import { PageFade } from "@/components/shared/page-fade";

export const metadata: Metadata = {
  title: "Browse all cars — used & new inventory",
  description:
    "Full marketplace inventory: filter by city, brand, fuel, body type, budget, and EMI. Grid or list view with infinite scroll.",
  keywords: "browse cars India, car listings, SUV sedan hatchback, car filter, Autolokate inventory",
};

function CarsBrowseFallback() {
  return (
    <PageFade>
      <div className="border-b border-border bg-linear-to-b from-secondary/60 to-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted/60" />
          <div className="mt-4 h-12 w-full max-w-lg animate-pulse rounded-lg bg-muted/40" />
          <div className="mt-6 flex gap-3">
            <div className="h-10 w-24 animate-pulse rounded-full bg-muted/50" />
            <div className="h-10 w-24 animate-pulse rounded-full bg-muted/50" />
            <div className="h-10 w-24 animate-pulse rounded-full bg-muted/50" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <CarsGridSkeleton />
      </div>
    </PageFade>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<CarsBrowseFallback />}>
      <CarsPageApi
        pageTitle="Browse all cars"
        pageSubtitle="Full catalogue: search by name, filter body and fuel, sort A–Z or by price — then open any model for trims and pricing."
      />
    </Suspense>
  );
}
