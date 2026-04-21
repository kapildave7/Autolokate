import { Suspense } from "react";
import type { Metadata } from "next";
import { CatalogueCompareView } from "@/components/compare/catalogue-compare-view";

export const metadata: Metadata = {
  title: "Compare catalogue variants",
  description:
    "Compare up to three new-car catalogue variants side by side (ex-showroom specs). Separate from inventory listing compare.",
  robots: { index: false, follow: true },
};

export default function CatalogueComparePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-muted-foreground">
          Loading comparison…
        </div>
      }
    >
      <CatalogueCompareView />
    </Suspense>
  );
}
