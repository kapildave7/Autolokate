"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/brands/brand-logo";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Car,
  ChevronRight,
  Filter,
  GitCompare,
  LayoutGrid,
  List,
  RotateCcw,
  Search,
  Sparkles,
} from "lucide-react";
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

// Banner image fallback — a generic showroom/cars image
const BANNER_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&auto=format&fit=crop&q=80";

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
  const [view, setView] = useState<"grid" | "list">("grid");
  const [compareBusyByKey, setCompareBusyByKey] = useState<Record<string, boolean>>({});
  const addVariant = useCompareStore((s) => s.addVariant);
  const removeByListingId = useCompareStore((s) => s.removeByListingId);
  const hasListing = useCompareStore((s) => s.hasListing);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["catalogue-models", lockedBrand ?? "all"],
    queryFn: () => (lockedBrand ? getBrandModels(slugifyPart(lockedBrand)) : getModels()),
  });

  const listings = useMemo(() => (data ?? []) as Listing[], [data]);

  // Pull up to 3 hero images for the banner showcase
  const bannerImages = useMemo(() => {
    const withImg = listings.filter(
      (l) => typeof l.hero_image_url === "string" && l.hero_image_url.trim().length > 0
    );
    return withImg.slice(0, 3).map((l) => ({
      url: (l.hero_image_url as string).trim(),
      label: `${pickBrandName(l)} ${pickModelName(l)}`,
    }));
  }, [listings]);

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

  // Derive a friendly brand label for display
  const brandDisplayName = lockedBrand ?? "";

  return (
    <PageFade>
      {/* ── HERO BANNER ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 dark:from-[#0a0a0f] dark:via-[#0d1424] dark:to-[#0a0a0f]">
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
        >
          <div className="absolute right-0 top-0 h-[500px] w-[60%] rounded-full bg-blue-500/[0.04] blur-3xl dark:bg-blue-500/[0.08]" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-primary/[0.03] blur-2xl dark:bg-primary/[0.06]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8 lg:pb-14 lg:pt-10">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="transition hover:text-foreground">Home</Link>
            <ChevronRight className="h-3 w-3 shrink-0" aria-hidden />
            <Link href="/cars" className="transition hover:text-foreground">Cars</Link>
            {brandDisplayName ? (
              <>
                <ChevronRight className="h-3 w-3 shrink-0" aria-hidden />
                <span className="text-foreground font-medium">{brandDisplayName}</span>
              </>
            ) : null}
          </nav>

          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Left — text content */}
            <div className="order-2 lg:order-1">
              <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Catalogue
              </p>

              <h1 className="font-display mt-3 text-[2rem] font-bold leading-[1.1] tracking-tight text-foreground sm:text-4xl lg:text-[2.6rem]">
                {brandDisplayName ? (
                  <>
                    Discover {brandDisplayName}
                    <br />
                    <span className="text-primary">in the live catalogue.</span>
                  </>
                ) : (
                  <>
                    {pageTitle.split(" ").slice(0, -1).join(" ")}
                    <br />
                    <span className="text-primary">{pageTitle.split(" ").slice(-1)[0]}</span>
                  </>
                )}
              </h1>

              <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                {pageSubtitle}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button
                  size="default"
                  className="gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-md hover:bg-primary/90"
                  onClick={() => {
                    document.getElementById("catalogue-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  Explore {brandDisplayName || "full"} range
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
                {brandDisplayName ? (
                  <BrandLogo
                    brand={brandDisplayName}
                    size={40}
                    className="rounded-xl border border-border/60 bg-card shadow-sm"
                  />
                ) : null}
              </div>
            </div>

            {/* Right — car image showcase */}
            <div className="order-1 lg:order-2">
              <div className="relative h-52 sm:h-64 lg:h-72">
                {bannerImages.length > 0 ? (
                  <div className="flex h-full items-end justify-center gap-3 lg:justify-end">
                    {bannerImages.map((img, i) => (
                      <div
                        key={img.url}
                        className={cn(
                          "relative shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg ring-1 ring-black/[0.06]",
                          "transition-transform duration-300",
                          i === 0
                            ? "h-40 w-36 translate-y-4 sm:h-52 sm:w-44 lg:h-60 lg:w-52"
                            : i === 1
                              ? "h-44 w-40 sm:h-56 sm:w-48 lg:h-64 lg:w-56"
                              : "h-36 w-32 translate-y-6 sm:h-48 sm:w-44 lg:h-56 lg:w-48"
                        )}
                        style={{ opacity: 1 - i * 0.06 }}
                      >
                        <Image
                          src={img.url}
                          alt={img.label}
                          fill
                          className="object-cover object-center"
                          sizes="(max-width: 640px) 144px, (max-width: 1024px) 192px, 224px"
                          priority={i === 1}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  // Fallback generic banner image
                  <div className="relative h-full overflow-hidden rounded-2xl border border-border/60 shadow-lg">
                    <Image
                      src={BANNER_FALLBACK_IMG}
                      alt="Car catalogue"
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FILTERS + GRID ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">

        {/* Filter bar */}
        <div className="rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm ring-1 ring-foreground/[0.03] backdrop-blur-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              Filters &amp; sort
            </p>
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                onClick={clearFilters}
              >
                <RotateCcw className="h-3 w-3" aria-hidden />
                Clear
              </Button>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Brand or model name"
                className="h-10 rounded-xl border-border/70 bg-background pl-9 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-primary/30"
                aria-label="Search by brand or model"
              />
            </div>

            {/* Body type */}
            <Select value={bodyType} onValueChange={setBodyType}>
              <SelectTrigger className="h-10 w-full rounded-xl border-border/70 bg-background text-sm focus:ring-primary/30" aria-label="Filter by body type">
                <SelectValue placeholder="All body types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All body types</SelectItem>
                {bodyOptions.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Fuel type */}
            <Select value={fuelType} onValueChange={setFuelType}>
              <SelectTrigger className="h-10 w-full rounded-xl border-border/70 bg-background text-sm focus:ring-primary/30" aria-label="Filter by fuel type">
                <SelectValue placeholder="All fuel types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All fuel types</SelectItem>
                {fuelOptions.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
              <SelectTrigger className="h-10 w-full rounded-xl border-border/70 bg-background text-sm focus:ring-primary/30" aria-label="Sort listings">
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

        {/* Results count + view toggle */}
        <div className="mb-5 mt-5 flex flex-wrap items-center gap-2 text-sm">
          <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="text-muted-foreground">
            Showing{" "}
            <span className="font-semibold tabular-nums text-foreground">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "model" : "models"}
          </span>
          {lockedBrand ? (
            <Badge
              variant="secondary"
              className="rounded-full border border-primary/20 bg-primary/8 px-2.5 py-0.5 text-[11px] font-medium text-primary"
            >
              {lockedBrand} ×
            </Badge>
          ) : null}
          {isError ? (
            <span className="text-destructive text-xs">Could not refresh catalogue — showing last result if any.</span>
          ) : null}

          {/* View toggle */}
          <div className="ml-auto flex items-center gap-1 rounded-xl border border-border/70 bg-card p-1 shadow-sm">
            <button
              type="button"
              aria-label="Grid view"
              onClick={() => setView("grid")}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg transition",
                view === "grid"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="List view"
              onClick={() => setView("list")}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg transition",
                view === "list"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Grid / empty / skeleton */}
        <div id="catalogue-grid" className="scroll-mt-24">
          {isLoading ? (
            <CarsGridSkeleton />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
              <Car className="h-10 w-10 text-muted-foreground/50" aria-hidden />
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
          ) : view === "grid" ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
              {filtered.map((item, idx) => (
                <CatalogueCard
                  key={item.id || `${pickBrandName(item)}-${pickModelName(item)}-${idx}`}
                  item={item}
                  idx={idx}
                  detailsBasePath={detailsBasePath}
                  compareHas={hasListing(listingEntryKey(item, idx))}
                  compareBusy={compareBusyByKey[listingEntryKey(item, idx)] === true}
                  onCompare={() => {
                    const ek = listingEntryKey(item, idx);
                    if (hasListing(ek)) { removeByListingId(ek); return; }
                    setCompareBusyByKey((prev) => ({ ...prev, [ek]: true }));
                    void (async () => {
                      const variantId = await resolveCatalogueModelToVariantId(item);
                      setCompareBusyByKey((prev) => ({ ...prev, [ek]: false }));
                      if (!variantId) { toast.message("Could not resolve a default variant for this model."); return; }
                      const ok = addVariant(variantId, { listingCarId: ek });
                      if (!ok) toast.message("Compare is full (max 3).");
                      else toast.success("Added to compare.");
                    })();
                  }}
                />
              ))}
            </ul>
          ) : (
            <ul className="flex flex-col gap-3">
              {filtered.map((item, idx) => (
                <CatalogueListRow
                  key={item.id || `${pickBrandName(item)}-${pickModelName(item)}-${idx}`}
                  item={item}
                  idx={idx}
                  detailsBasePath={detailsBasePath}
                  compareHas={hasListing(listingEntryKey(item, idx))}
                  compareBusy={compareBusyByKey[listingEntryKey(item, idx)] === true}
                  onCompare={() => {
                    const ek = listingEntryKey(item, idx);
                    if (hasListing(ek)) { removeByListingId(ek); return; }
                    setCompareBusyByKey((prev) => ({ ...prev, [ek]: true }));
                    void (async () => {
                      const variantId = await resolveCatalogueModelToVariantId(item);
                      setCompareBusyByKey((prev) => ({ ...prev, [ek]: false }));
                      if (!variantId) { toast.message("Could not resolve a default variant for this model."); return; }
                      const ok = addVariant(variantId, { listingCarId: ek });
                      if (!ok) toast.message("Compare is full (max 3).");
                      else toast.success("Added to compare.");
                    })();
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    </PageFade>
  );
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

function buildCardData(item: Listing) {
  const brandLabel = pickBrandName(item);
  const modelLabel = pickModelName(item);
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
    discontinued ? "Discontinued" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return { brandLabel, modelLabel, heroUrl, price, metaLine, discontinued };
}

function buildHref(item: Listing, detailsBasePath: string): string {
  const modelSlug = String(item.slug ?? "").trim();
  const brandSlug = String(item.brand_slug ?? "").trim();
  if (modelSlug.length > 0) {
    return brandSlug.length > 0
      ? `/cars/${encodeURIComponent(brandSlug)}/${encodeURIComponent(modelSlug)}`
      : `${detailsBasePath}/${encodeURIComponent(modelSlug)}`;
  }
  return "/cars/explore";
}

// ─── Grid card ───────────────────────────────────────────────────────────────

function CatalogueCard({
  item,
  idx,
  detailsBasePath,
  compareHas,
  compareBusy,
  onCompare,
}: {
  item: Listing;
  idx: number;
  detailsBasePath: string;
  compareHas: boolean;
  compareBusy: boolean;
  onCompare: () => void;
}) {
  const { brandLabel, modelLabel, heroUrl, price, metaLine, discontinued } = buildCardData(item);
  const href = buildHref(item, detailsBasePath);

  return (
    <li>
      <div
        className={cn(
          "group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card text-left shadow-[0_2px_12px_-6px_rgba(15,23,42,0.12)] ring-1 ring-black/[0.03]",
          "transition-[transform,box-shadow,border-color] duration-200",
          "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_28px_-10px_rgba(37,99,235,0.18)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
          "dark:shadow-none dark:ring-white/[0.03] dark:hover:border-primary/35 dark:hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.2),0_8px_32px_-12px_hsl(var(--primary)/0.25)]"
        )}
      >
        {/* Image */}
        <Link href={href} tabIndex={-1} aria-hidden className="block shrink-0">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/60 dark:bg-muted/40">
            {heroUrl ? (
              <Image
                src={heroUrl}
                alt={`${brandLabel} ${modelLabel}`}
                fill
                className="object-cover object-center transition duration-300 group-hover:scale-[1.025] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 24rem"
                priority={idx < 3}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Car className="h-10 w-10 text-muted-foreground/30" />
              </div>
            )}
            {discontinued ? (
              <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground backdrop-blur-sm">
                Discontinued
              </span>
            ) : null}
          </div>
        </Link>

        {/* Content */}
        <Link href={href} className="flex min-w-0 flex-1 flex-col gap-3 px-3.5 pb-3.5 pt-3 outline-none sm:px-4 sm:pb-4 sm:pt-3.5">
          {/* Brand + model */}
          <div className="flex items-start gap-3">
            <BrandLogo
              brand={brandLabel}
              size={30}
              className="mt-0.5 shrink-0 rounded-lg border border-border/60 bg-background shadow-none"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:text-[11px]">
                {brandLabel}
              </p>
              <h2 className="font-display text-[0.9rem] font-semibold leading-snug tracking-tight text-foreground sm:text-[0.9375rem]">
                {modelLabel}
              </h2>
              {metaLine ? (
                <p className="mt-0.5 line-clamp-1 text-[10px] leading-relaxed text-muted-foreground sm:text-[11px]">
                  {metaLine}
                </p>
              ) : null}
            </div>
          </div>

          {/* Price */}
          <div className="mt-auto border-t border-border/60 pt-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-primary/70 sm:text-[10px]">
              Ex-showroom (indicative)
            </p>
            <p className="mt-0.5 font-display text-[1.0625rem] font-bold tabular-nums tracking-tight text-foreground sm:text-lg">
              {price.line}
            </p>
            {price.hint ? (
              <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-[11px]">{price.hint}</p>
            ) : null}
          </div>
        </Link>

        {/* Actions */}
        <div className="flex shrink-0 gap-2 border-t border-border/60 bg-card px-3.5 py-2.5 sm:px-4 sm:py-3">
          <Button
            size="sm"
            className="h-8 min-h-8 flex-1 rounded-lg bg-primary text-[0.8125rem] font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            asChild
          >
            <Link href={href}>Details</Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            type="button"
            className={cn(
              "h-8 min-h-8 flex-1 justify-center gap-1.5 rounded-lg border-border/70 bg-muted/40 text-[0.8125rem] font-medium text-muted-foreground shadow-none",
              "hover:border-primary/40 hover:bg-primary/8 hover:text-primary",
              compareHas && "border-primary/50 bg-primary/10 text-primary hover:bg-primary/15"
            )}
            disabled={compareBusy}
            onClick={onCompare}
          >
            <GitCompare className="h-3.5 w-3.5 shrink-0" />
            {compareHas ? "Added" : compareBusy ? "…" : "Compare"}
          </Button>
        </div>
      </div>
    </li>
  );
}

// ─── List row ────────────────────────────────────────────────────────────────

function CatalogueListRow({
  item,
  idx,
  detailsBasePath,
  compareHas,
  compareBusy,
  onCompare,
}: {
  item: Listing;
  idx: number;
  detailsBasePath: string;
  compareHas: boolean;
  compareBusy: boolean;
  onCompare: () => void;
}) {
  const { brandLabel, modelLabel, heroUrl, price, metaLine, discontinued } = buildCardData(item);
  const href = buildHref(item, detailsBasePath);

  return (
    <li>
      <div
        className={cn(
          "group flex items-stretch gap-0 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_2px_8px_-4px_rgba(15,23,42,0.10)] ring-1 ring-black/[0.03]",
          "transition-[border-color,box-shadow] duration-200 hover:border-primary/20 hover:shadow-[0_4px_16px_-8px_rgba(15,23,42,0.14)]",
          "dark:shadow-none dark:ring-white/[0.03] dark:hover:border-primary/25"
        )}
      >
        {/* Thumbnail */}
        <Link href={href} tabIndex={-1} aria-hidden className="block shrink-0">
          <div className="relative h-full w-28 overflow-hidden bg-muted/60 sm:w-40">
            {heroUrl ? (
              <Image
                src={heroUrl}
                alt={`${brandLabel} ${modelLabel}`}
                fill
                className="object-cover object-center transition duration-300 group-hover:scale-[1.025] motion-reduce:transition-none"
                sizes="(max-width: 640px) 112px, 160px"
                priority={idx < 6}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Car className="h-8 w-8 text-muted-foreground/30" />
              </div>
            )}
          </div>
        </Link>

        {/* Details */}
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:py-4">
          <Link href={href} className="flex min-w-0 flex-1 flex-col gap-1 outline-none">
            <div className="flex items-center gap-2.5">
              <BrandLogo
                brand={brandLabel}
                size={24}
                className="shrink-0 rounded-md border border-border/60 bg-background"
              />
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:text-[11px]">
                {brandLabel}
              </p>
              {discontinued ? (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                  Discontinued
                </span>
              ) : null}
            </div>
            <h2 className="font-display text-[0.9375rem] font-semibold tracking-tight text-foreground sm:text-base">
              {modelLabel}
            </h2>
            {metaLine ? (
              <p className="line-clamp-1 text-[11px] text-muted-foreground">{metaLine}</p>
            ) : null}
          </Link>

          {/* Price + actions */}
          <div className="flex shrink-0 items-center gap-4">
            <div className="hidden sm:block">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-primary/70">
                Ex-showroom
              </p>
              <p className="font-display text-base font-bold tabular-nums tracking-tight text-foreground">
                {price.line}
              </p>
              {price.hint ? (
                <p className="text-[10px] text-muted-foreground">{price.hint}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-8 rounded-lg bg-primary px-4 text-[0.8125rem] font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                asChild
              >
                <Link href={href}>Details</Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                type="button"
                className={cn(
                  "h-8 gap-1.5 rounded-lg border-border/70 bg-muted/40 px-3 text-[0.8125rem] font-medium text-muted-foreground",
                  "hover:border-primary/40 hover:bg-primary/8 hover:text-primary",
                  compareHas && "border-primary/50 bg-primary/10 text-primary"
                )}
                disabled={compareBusy}
                onClick={onCompare}
              >
                <GitCompare className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{compareHas ? "Added" : compareBusy ? "…" : "Compare"}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
