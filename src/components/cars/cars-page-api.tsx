"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/brands/brand-logo";
import { useQuery } from "@tanstack/react-query";
import { Car, ChevronRight, Filter, GitCompare, RotateCcw, Search, Sparkles } from "lucide-react";
import { getBrandModels, getModels } from "@/lib/client/catalogue-api";
import { resolveCatalogueModelToVariantId } from "@/lib/compare-listing-resolve";
import { slugifyPart } from "@/lib/seo/slugs";
import { cn, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CarsGridSkeleton } from "@/components/cars/cars-grid-skeleton";
import { PageFade } from "@/components/shared/page-fade";
import { useCompareStore } from "@/stores/compare-store";
import { toast } from "sonner";

type BrandRef = {
  name?: string;
  slug?: string;
  country?: string;
};

type Listing = {
  id: string;
  /** Model display name (API may send `name` or `model_name`). */
  name?: string;
  brand_name?: string;
  brand_slug?: string;
  model_name?: string;
  brand?: BrandRef;
  slug?: string;
  body_type?: string;
  fuel_type?: string;
  fuel_types?: string[];
  starting_price?: number;
  min_price?: number;
  max_price?: number;
  hero_image_url?: string;
  variant_count?: number;
  description?: string;
  launch_year?: number;
  vehicle_category?: string;
  is_discontinued?: boolean;
  [key: string]: unknown;
};

type Props = {
  pageTitle: string;
  pageSubtitle: string;
  /** When true, “Popular” uses a stable mixed order (good for /cars/explore). */
  discoverySort?: boolean;
  lockedBrand?: string;
  detailsBasePath?: string;
};

function toPositiveNumber(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function pickBrandName(item: Listing): string {
  const direct = String(item.brand_name ?? "").trim();
  if (direct) return direct;
  const b = item.brand;
  if (b && typeof b === "object") {
    const n = String(b.name ?? "").trim();
    if (n) return n;
  }
  return "Brand";
}

function pickModelName(item: Listing): string {
  return String(item.model_name ?? item.name ?? "").trim() || "Model";
}

function humanizeSegment(raw: string): string {
  const s = raw.trim();
  if (!s) return "—";
  return s
    .replace(/_/g, " ")
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function listingSearchBlob(r: Listing): string {
  const b = pickBrandName(r);
  const m = pickModelName(r);
  const slug = String(r.slug ?? "");
  const nestedSlug = r.brand && typeof r.brand === "object" ? String(r.brand.slug ?? "").trim() : "";
  return `${b} ${m} ${slug} ${nestedSlug} ${String(r.brand_slug ?? "")}`.toLowerCase();
}

/** Stable hash for discovery ordering (same order on every render). */
function discoveryOrderKey(row: Listing): number {
  const s = `${String(row.slug ?? "")}|${String(row.id ?? "")}|${pickBrandName(row)}|${pickModelName(row)}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function priceLow(row: Listing): number {
  return (
    toPositiveNumber(row.min_price) ??
    toPositiveNumber(row.starting_price) ??
    toPositiveNumber(row.max_price) ??
    0
  );
}

function priceHigh(row: Listing): number {
  const hi = toPositiveNumber(row.max_price);
  const lo = toPositiveNumber(row.min_price ?? row.starting_price);
  if (hi != null) return hi;
  return lo ?? 0;
}

function sortLabelKey(row: Listing): string {
  return `${pickBrandName(row).toLowerCase()}\u0000${pickModelName(row).toLowerCase()}`;
}


function listingEntryKey(item: Listing, index: number): string {
  const id = String(item.id ?? "").trim();
  if (id) return `catalogue-model:${id}`;
  const slug = String(item.slug ?? "").trim();
  if (slug) return `catalogue-model:${slug}`;
  return `catalogue-model:${pickBrandName(item)}:${pickModelName(item)}:${index}`;
}

function formatPriceBlock(item: Listing): { line: string; hint?: string } {
  const min = toPositiveNumber(item.min_price ?? item.starting_price);
  const max = toPositiveNumber(item.max_price);
  if (min == null && max == null) return { line: "Price on request", hint: "Contact for quote" };
  if (min != null && max != null && max > min + 500) {
    return { line: `From ${formatINR(min)}`, hint: `Up to ${formatINR(max)} · Ex-showroom` };
  }
  const n = min ?? max ?? 0;
  return { line: formatINR(n), hint: "Ex-showroom" };
}

/** Same visual language as `AiMatchedCarCard` (discovery “Your matched cars”). */
const catalogueCardShell = cn(
  "group flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card text-left text-[0.9375rem] shadow-[0_4px_18px_-12px_rgba(15,23,42,0.1)] ring-1 ring-black/[0.03] sm:text-[0.96875rem]",
  "transition-[transform,box-shadow,border-color] duration-200",
  "hover:-translate-y-0.5 hover:border-primary/15 hover:shadow-[0_12px_28px_-16px_rgba(15,23,42,0.14)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
);

export function CarsPageApi({
  pageTitle,
  pageSubtitle,
  discoverySort = false,
  lockedBrand,
  detailsBasePath = "/cars",
}: Props) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"popular" | "price-asc" | "price-desc">("popular");
  const [bodyType, setBodyType] = useState("all");
  const [fuelType, setFuelType] = useState("all");
  const [compareBusyByKey, setCompareBusyByKey] = useState<Record<string, boolean>>({});
  const addVariant = useCompareStore((s) => s.addVariant);
  const removeByListingId = useCompareStore((s) => s.removeByListingId);
  const hasListing = useCompareStore((s) => s.hasListing);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["catalogue-models", lockedBrand ?? "all"],
    queryFn: () => (lockedBrand ? getBrandModels(slugifyPart(lockedBrand)) : getModels()),
  });

  const listings = useMemo(() => (data ?? []) as Listing[], [data]);

  const bodyOptions = useMemo(
    () =>
      Array.from(new Set(listings.map((l) => String(l.body_type || "").trim()).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [listings]
  );
  const fuelOptions = useMemo(
    () =>
      Array.from(
        new Set(
          listings
            .flatMap((l) =>
              Array.isArray(l.fuel_types) && l.fuel_types.length
                ? l.fuel_types.map((fuel) => String(fuel || "").trim())
                : [String(l.fuel_type || "").trim()]
            )
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [listings]
  );

  const filtered = useMemo(() => {
    let rows = [...listings];
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) => listingSearchBlob(r).includes(q));
    }
    if (lockedBrand) {
      const want = lockedBrand.toLowerCase().trim();
      rows = rows.filter((r) => pickBrandName(r).toLowerCase() === want);
    }
    if (bodyType !== "all") rows = rows.filter((r) => String(r.body_type ?? "") === bodyType);
    if (fuelType !== "all") {
      rows = rows.filter((r) => {
        const options =
          Array.isArray(r.fuel_types) && r.fuel_types.length
            ? r.fuel_types.map((fuel) => String(fuel))
            : [String(r.fuel_type ?? "")];
        return options.includes(fuelType);
      });
    }

    if (sort === "price-asc") {
      rows.sort((a, b) => priceLow(a) - priceLow(b) || sortLabelKey(a).localeCompare(sortLabelKey(b)));
    } else if (sort === "price-desc") {
      rows.sort((a, b) => priceHigh(b) - priceHigh(a) || sortLabelKey(a).localeCompare(sortLabelKey(b)));
    } else {
      // popular
      if (discoverySort) {
        rows.sort((a, b) => discoveryOrderKey(a) - discoveryOrderKey(b));
      } else {
        rows.sort((a, b) => sortLabelKey(a).localeCompare(sortLabelKey(b)));
      }
    }
    return rows;
  }, [listings, query, bodyType, fuelType, sort, lockedBrand, discoverySort]);

  const hasActiveFilters = query.trim() !== "" || bodyType !== "all" || fuelType !== "all";

  const clearFilters = () => {
    setQuery("");
    setBodyType("all");
    setFuelType("all");
  };

  return (
    <PageFade>
      <section className="relative overflow-hidden border-b border-border bg-linear-to-b from-secondary/50 via-background to-background">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_100%_-20%,hsl(var(--primary)/0.08),transparent_55%),radial-gradient(ellipse_70%_50%_at_0%_100%,hsl(var(--muted)/0.5),transparent_50%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Catalogue
          </p>
          <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.5rem]">
            {pageTitle}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{pageSubtitle}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm ring-1 ring-foreground/4 backdrop-blur-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filters &amp; sort</p>
            {hasActiveFilters ? (
              <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 self-start text-muted-foreground sm:self-auto" onClick={clearFilters}>
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Clear filters
              </Button>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
            <div className="relative sm:col-span-2 lg:col-span-2">
              <label className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Brand or model name"
                  className="h-10 pl-9"
                  aria-label="Search by brand or model"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
                Body
              </label>
              <Select value={bodyType} onValueChange={setBodyType}>
                <SelectTrigger className="h-10 w-full" aria-label="Filter by body type">
                  <SelectValue placeholder="Body type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All body types</SelectItem>
                  {bodyOptions.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
                Fuel
              </label>
              <Select value={fuelType} onValueChange={setFuelType}>
                <SelectTrigger className="h-10 w-full" aria-label="Filter by fuel type">
                  <SelectValue placeholder="Fuel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All fuel types</SelectItem>
                  {fuelOptions.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
                Sort
              </label>
              <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                <SelectTrigger className="h-10 w-full" aria-label="Sort listings">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">{discoverySort ? "Curated mix" : "A–Z by brand"}</SelectItem>
                  <SelectItem value="price-asc">Price · Low to high</SelectItem>
                  <SelectItem value="price-desc">Price · High to low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="mb-6 mt-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            Showing{" "}
            <span className="font-semibold tabular-nums text-foreground">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "model" : "models"}
          </span>
          {lockedBrand ? (
            <Badge variant="secondary" className="font-normal">
              {lockedBrand}
            </Badge>
          ) : null}
          {isError ? (
            <span className="text-destructive">Could not refresh catalogue — showing last result if any.</span>
          ) : null}
        </div>

        {isLoading ? (
          <CarsGridSkeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
            <Car className="h-10 w-10 text-muted-foreground/60" aria-hidden />
            <p className="mt-4 text-lg font-semibold text-foreground">No models match</p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Try a different search term, or reset filters to see the full catalogue.
            </p>
            {hasActiveFilters ? (
              <Button type="button" className="mt-6" variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item, idx) => {
              const modelSlug = String(item.slug ?? "").trim();
              const brandSlug = String(item.brand_slug ?? "").trim();
              const href =
                modelSlug.length > 0
                  ? brandSlug.length > 0
                    ? `/cars/brand/${encodeURIComponent(brandSlug)}/${encodeURIComponent(modelSlug)}`
                    : `${detailsBasePath}/${encodeURIComponent(modelSlug)}`
                  : "/cars/explore";
              const brandLabel = pickBrandName(item);
              const modelLabel = pickModelName(item);
              const compareEntryKey = listingEntryKey(item, idx);
              const compareHas = hasListing(compareEntryKey);
              const compareBusy = compareBusyByKey[compareEntryKey] === true;
              const heroUrl =
                typeof item.hero_image_url === "string" && item.hero_image_url.trim().length > 0
                  ? item.hero_image_url.trim()
                  : null;
              const fuelLabel =
                Array.isArray(item.fuel_types) && item.fuel_types.length
                  ? item.fuel_types.map((f) => humanizeSegment(String(f))).join(" · ")
                  : humanizeSegment(String(item.fuel_type || ""));
              const bodyRaw = String(item.body_type || "").trim();
              const body = bodyRaw ? humanizeSegment(bodyRaw) : "";
              const variants = typeof item.variant_count === "number" && item.variant_count > 0 ? item.variant_count : null;
              const price = formatPriceBlock(item);
              const desc = typeof item.description === "string" ? item.description.trim() : "";
              const excerpt = desc.length > 120 ? `${desc.slice(0, 117)}…` : desc;
              const launchYear = typeof item.launch_year === "number" && item.launch_year > 1900 ? item.launch_year : null;
              const vehicleCat =
                typeof item.vehicle_category === "string" && item.vehicle_category.trim()
                  ? humanizeSegment(item.vehicle_category)
                  : null;
              const discontinued = item.is_discontinued === true;
              const country =
                item.brand && typeof item.brand === "object" && typeof item.brand.country === "string"
                  ? item.brand.country.trim()
                  : null;

              const metaLine = [
                body || null,
                fuelLabel && fuelLabel !== "—" ? fuelLabel : null,
                launchYear != null ? `Since ${launchYear}` : null,
                vehicleCat,
                country,
                variants != null ? `${variants} variants` : null,
                discontinued ? "Discontinued in catalogue" : null,
              ]
                .filter(Boolean)
                .join(" · ");

              return (
                <li key={item.id || `${brandLabel}-${modelLabel}-${idx}`}>
                  <div className={catalogueCardShell}>
                    <Link href={href} className="flex min-h-0 flex-1 flex-col outline-none">
                      <div className="relative aspect-16/10 w-full shrink-0 overflow-hidden bg-muted sm:aspect-5/3">
                        {heroUrl ? (
                          <Image
                            src={heroUrl}
                            alt={`${brandLabel} ${modelLabel}`}
                            fill
                            className="object-cover object-center transition duration-300 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 24rem"
                            priority={false}
                          />
                        ) : (
                          <div className="flex h-full min-h-[100px] flex-col items-center justify-center bg-muted px-4 text-center sm:min-h-[108px]">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                              No hero image
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex min-h-0 flex-1 flex-col gap-2 px-2.5 pb-2.5 pt-2 sm:gap-2.5 sm:px-3 sm:pb-3 sm:pt-2.5">
                        <div className="rounded-md border border-border/80 bg-muted/35 px-2.5 py-1.5 sm:rounded-lg sm:px-3 sm:py-2">
                          <div className="flex gap-2.5">
                            <BrandLogo
                              brand={brandLabel}
                              size={32}
                              className="shrink-0 rounded-md border-border/60 bg-background shadow-none"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px]">
                                {brandLabel}
                              </p>
                              <h2 className="font-display text-[0.875rem] font-semibold leading-snug tracking-tight text-foreground sm:text-[0.9375rem]">
                                {modelLabel}
                              </h2>
                              {metaLine ? (
                                <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground sm:text-[11px] lg:text-xs">
                                  {metaLine}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          {excerpt ? (
                            <p className="mt-2 line-clamp-2 border-t border-border/60 pt-2 text-[10px] leading-relaxed text-muted-foreground sm:text-[11px]">
                              {excerpt}
                            </p>
                          ) : null}
                        </div>

                        <div className="rounded-md border border-border/80 bg-muted/40 px-2.5 py-2 sm:rounded-lg sm:px-3 sm:py-2.5">
                          <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-[9px]">
                            Ex-showroom (indicative)
                          </p>
                          <p className="mt-0.5 font-display text-sm font-semibold tabular-nums tracking-tight text-foreground sm:text-base">
                            {price.line}
                          </p>
                          {price.hint ? (
                            <p className="mt-1 text-[10px] leading-snug text-muted-foreground sm:text-[11px]">{price.hint}</p>
                          ) : null}
                        </div>
                      </div>

                    </Link>
                    <div className="flex shrink-0 gap-2 border-t border-border/60 bg-card px-2.5 py-2 sm:px-3 sm:py-2.5">
                      <Button
                        size="sm"
                        variant="listing"
                        className="h-9 min-h-9 flex-1 !border-transparent !bg-[#2AAA8A] !text-white shadow-sm hover:!border-transparent hover:!bg-[rgb(42,170,138)]/90"
                        asChild
                      >
                        <Link href={href}>Details</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        className={cn(
                          "h-9 min-h-9 flex-1 justify-center gap-1.5 border-warn-soft-foreground/25 bg-warn-soft text-warn-soft-foreground shadow-none hover:border-primary/30 hover:bg-warn-soft/90",
                          compareHas && "border-warn-soft-foreground/45 bg-warn-soft/95"
                        )}
                        disabled={compareBusy}
                        onClick={() => {
                          if (compareHas) {
                            removeByListingId(compareEntryKey);
                            return;
                          }
                          setCompareBusyByKey((prev) => ({ ...prev, [compareEntryKey]: true }));
                          void (async () => {
                            const variantId = await resolveCatalogueModelToVariantId(item);
                            setCompareBusyByKey((prev) => ({ ...prev, [compareEntryKey]: false }));
                            if (!variantId) {
                              toast.message("Could not resolve a default variant for this model.");
                              return;
                            }
                            const ok = addVariant(variantId, { listingCarId: compareEntryKey });
                            if (!ok) toast.message("Compare is full (max 3).");
                            else toast.success("Added to compare.");
                          })();
                        }}
                      >
                        <GitCompare className="h-4 w-4 shrink-0" />
                        {compareHas ? "Added" : compareBusy ? "..." : "Compare"}
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </PageFade>
  );
}
