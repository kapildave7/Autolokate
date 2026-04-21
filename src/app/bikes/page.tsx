import type { Metadata } from "next";
import { Suspense } from "react";
import { BikesPage as BikesBrowsePage } from "@/components/bikes/bikes-page";

export const metadata: Metadata = {
  title: "Browse bikes — scooters, commuters, sports",
  description: "Filter bikes by city, fuel, price and body style. Grid/list views with clean listing cards.",
};

export default function BikesPageRoute() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-16 text-sm text-muted-foreground sm:px-6 lg:px-8">Loading bikes…</div>}>
      <BikesBrowsePage />
    </Suspense>
  );
}

