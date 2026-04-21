import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareView } from "@/components/compare/compare-view";

export const metadata: Metadata = {
  title: "Compare cars — price, specs, mileage",
  description:
    "Compare up to three new-car catalogue variants side by side: ex-showroom price, mileage, fuel, transmission, and specs from the API.",
  keywords: "compare cars India, car comparison tool, SUV vs SUV, which car to buy",
};

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-muted-foreground">Loading compare…</div>
      }
    >
      <CompareView />
    </Suspense>
  );
}
