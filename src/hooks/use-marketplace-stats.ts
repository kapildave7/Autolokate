"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { cars } from "@/data";
import { getBrands } from "@/lib/client/catalogue-api";

type BrandRow = { name?: string; brand_name?: string };

function dedupeBrandNames(rows: BrandRow[]): string[] {
  const names = rows
    .map((b) => String(b.name ?? b.brand_name ?? "").trim())
    .filter(Boolean);
  return [...new Set(names)];
}

/** Unique brands represented in static inventory JSON. */
export const inventoryBrandCount = new Set(cars.map((c) => c.brand)).size;

/** Used-car listing rows in bundled inventory. */
export const inventoryListingCount = cars.length;

/** Cities with at least one inventory listing (from `cars`). */
export const inventoryCityCount = new Set(
  cars.map((c) => c.city?.trim()).filter((c): c is string => Boolean(c))
).size;

/**
 * Live marketplace headline stats:
 * - **Brands**: catalogue API (`/v1/catalogue/brands`) when available; else inventory-only brand count.
 * - **Listings**: inventory listing rows (`cars.length`) — matches `/cars` feed.
 * - **Cities**: distinct cities present on inventory listings.
 */
export function useMarketplaceStats() {
  const { data, isError } = useQuery({
    queryKey: ["marketplace-stats-catalogue-brands"],
    queryFn: () => getBrands(),
    staleTime: 5 * 60_000,
  });

  const brandCount = useMemo(() => {
    const rows = (data ?? []) as BrandRow[];
    const names = dedupeBrandNames(rows);
    if (!isError && names.length > 0) return names.length;
    return inventoryBrandCount;
  }, [data, isError]);

  return {
    brandCount,
    listingCount: inventoryListingCount,
    cityCount: inventoryCityCount,
  };
}
