"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Filter,
  GitCompare,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Tags,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  bodyTypes,
  brands,
  cars,
  exteriorColors,
  filterCars,
  getBestDeals,
  type CarFilters,
} from "@/data";
import type { Car } from "@/data/types";
import { cn, formatINR } from "@/lib/utils";
import { useCompareStore } from "@/stores/compare-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CarCard } from "./car-card";
import { CarsGridSkeleton } from "./cars-grid-skeleton";
import { CarsEmptyState } from "./empty-state";
import { PageFade } from "@/components/shared/page-fade";
import { BrandLogo } from "@/components/brands/brand-logo";
import { HomeExpertBookCta } from "@/components/home/home-expert-book-cta";
import { CarsBrowseExploreSection } from "@/components/cars/cars-browse-explore-section";
import { GA_CATEGORIES, carFiltersAnalyticsSummary, trackEvent } from "@/lib/analytics";

function parseFilters(sp: URLSearchParams): CarFilters {
  const num = (k: string) => {
    const v = sp.get(k);
    if (v == null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const sortRaw = sp.get("sort");
  const sort =
    sortRaw === "price-asc" ||
    sortRaw === "price-desc" ||
    sortRaw === "newest" ||
    sortRaw === "emi-asc" ||
    sortRaw === "discount-desc" ||
    sortRaw === "curated"
      ? sortRaw
      : "newest";
  const seller = sp.get("seller");
  return {
    query: sp.get("q") || undefined,
    brand: sp.get("brand") || undefined,
    model: sp.get("model") || undefined,
    variant: sp.get("variant") || undefined,
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    maxEmi: num("maxEmi"),
    minDiscount: num("minDiscount"),
    fuel: sp.get("fuel") || undefined,
    transmission: sp.get("transmission") || undefined,
    minYear: num("minYear"),
    maxYear: num("maxYear"),
    maxOwners: num("maxOwners"),
    city: sp.get("city") || undefined,
    bodyType: sp.get("bodyType") || undefined,
    exteriorColor: sp.get("color") || undefined,
    sellerType:
      seller === "Dealer" || seller === "Individual" ? seller : undefined,
    certifiedOnly: sp.get("certified") === "1",
    isNew: sp.get("condition") === "new" ? true : sp.get("condition") === "used" ? false : undefined,
    sort,
  };
}

function filtersToParams(f: CarFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.query) p.set("q", f.query);
  if (f.brand) p.set("brand", f.brand);
  if (f.model) p.set("model", f.model);
  if (f.variant) p.set("variant", f.variant);
  if (f.minPrice != null) p.set("minPrice", String(f.minPrice));
  if (f.maxPrice != null) p.set("maxPrice", String(f.maxPrice));
  if (f.maxEmi != null) p.set("maxEmi", String(f.maxEmi));
  if (f.minDiscount != null) p.set("minDiscount", String(f.minDiscount));
  if (f.fuel) p.set("fuel", f.fuel);
  if (f.transmission) p.set("transmission", f.transmission);
  if (f.minYear != null) p.set("minYear", String(f.minYear));
  if (f.maxYear != null) p.set("maxYear", String(f.maxYear));
  if (f.maxOwners != null) p.set("maxOwners", String(f.maxOwners));
  if (f.city) p.set("city", f.city);
  if (f.bodyType) p.set("bodyType", f.bodyType);
  if (f.exteriorColor) p.set("color", f.exteriorColor);
  if (f.sellerType) p.set("seller", f.sellerType);
  if (f.certifiedOnly) p.set("certified", "1");
  if (f.isNew === true) p.set("condition", "new");
  if (f.isNew === false) p.set("condition", "used");
  if (f.sort) p.set("sort", f.sort);
  return p;
}

function removeUrlFilter(f: CarFilters, key: keyof CarFilters): CarFilters {
  const next = { ...f };
  switch (key) {
    case "query":
      delete next.query;
      break;
    case "brand":
      delete next.brand;
      break;
    case "model":
      delete next.model;
      break;
    case "variant":
      delete next.variant;
      break;
    case "minPrice":
      delete next.minPrice;
      break;
    case "maxPrice":
      delete next.maxPrice;
      break;
    case "maxEmi":
      delete next.maxEmi;
      break;
    case "minDiscount":
      delete next.minDiscount;
      break;
    case "fuel":
      delete next.fuel;
      break;
    case "transmission":
      delete next.transmission;
      break;
    case "minYear":
      delete next.minYear;
      break;
    case "maxYear":
      delete next.maxYear;
      break;
    case "maxOwners":
      delete next.maxOwners;
      break;
    case "city":
      delete next.city;
      break;
    case "bodyType":
      delete next.bodyType;
      break;
    case "exteriorColor":
      delete next.exteriorColor;
      break;
    case "sellerType":
      delete next.sellerType;
      break;
    case "certifiedOnly":
      next.certifiedOnly = false;
      break;
    case "isNew":
      delete next.isNew;
      break;
    case "sort":
      next.sort = "newest";
      break;
    default:
      break;
  }
  return next;
}

type FilterChip = { key: keyof CarFilters; label: string };

function activeFilterChips(f: CarFilters): FilterChip[] {
  const chips: FilterChip[] = [];
  if (f.query?.trim()) chips.push({ key: "query", label: `“${f.query.trim()}”` });
  if (f.brand) chips.push({ key: "brand", label: f.brand });
  if (f.model) chips.push({ key: "model", label: f.model });
  if (f.variant) chips.push({ key: "variant", label: f.variant });
  if (f.city) chips.push({ key: "city", label: f.city });
  if (f.bodyType) chips.push({ key: "bodyType", label: f.bodyType });
  if (f.fuel) chips.push({ key: "fuel", label: f.fuel });
  if (f.transmission) chips.push({ key: "transmission", label: f.transmission });
  if (f.exteriorColor) chips.push({ key: "exteriorColor", label: f.exteriorColor });
  if (f.sellerType) chips.push({ key: "sellerType", label: `${f.sellerType} sellers` });
  if (f.minPrice != null) chips.push({ key: "minPrice", label: `From ${formatINR(f.minPrice)}` });
  if (f.maxPrice != null) chips.push({ key: "maxPrice", label: `Up to ${formatINR(f.maxPrice)}` });
  if (f.maxEmi != null) chips.push({ key: "maxEmi", label: `EMI ≤ ${formatINR(f.maxEmi)}/mo` });
  if (f.minDiscount != null) chips.push({ key: "minDiscount", label: `${f.minDiscount}%+ off` });
  if (f.minYear != null) chips.push({ key: "minYear", label: `${f.minYear}+` });
  if (f.maxYear != null) chips.push({ key: "maxYear", label: `≤ ${f.maxYear}` });
  if (f.maxOwners != null) chips.push({ key: "maxOwners", label: `≤ ${f.maxOwners} owner(s)` });
  if (f.certifiedOnly) chips.push({ key: "certifiedOnly", label: "Certified only" });
  if (f.isNew === true) chips.push({ key: "isNew", label: "New cars" });
  if (f.isNew === false) chips.push({ key: "isNew", label: "Used only" });
  if (f.sort && f.sort !== "newest" && f.sort !== "curated") {
    const sortLabels: Record<string, string> = {
      "price-asc": "Sort: price ↑",
      "price-desc": "Sort: price ↓",
      "emi-asc": "Sort: EMI ↑",
      "discount-desc": "Sort: top deals",
    };
    const sl = sortLabels[f.sort];
    if (sl) chips.push({ key: "sort", label: sl });
  }
  return chips;
}

function FilterFields({
  value,
  onChange,
  locked,
}: {
  value: CarFilters;
  onChange: (next: CarFilters) => void;
  locked?: Partial<CarFilters>;
}) {
  const set = (patch: Partial<CarFilters>) => onChange({ ...value, ...patch });
  const L = locked ?? {};

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Keywords</Label>
        <Input
          placeholder="Model, city, fuel…"
          value={value.query ?? ""}
          onChange={(e) => set({ query: e.target.value || undefined })}
        />
      </div>
      <div className="space-y-2">
        <Label>Brand</Label>
        <Select
          value={value.brand ?? "all"}
          onValueChange={(v) => set({ brand: v === "all" ? undefined : v })}
          disabled={L.brand != null}
        >
          <SelectTrigger>
            <SelectValue placeholder="All brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All brands</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Min price (₹)</Label>
          <Input
            type="number"
            placeholder="0"
            value={value.minPrice ?? ""}
            onChange={(e) =>
              set({ minPrice: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Max price (₹)</Label>
          <Input
            type="number"
            placeholder="Any"
            value={value.maxPrice ?? ""}
            onChange={(e) =>
              set({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Max EMI / month (₹)</Label>
        <Input
          type="number"
          placeholder="e.g. 35000"
          value={value.maxEmi ?? ""}
          onChange={(e) =>
            set({ maxEmi: e.target.value ? Number(e.target.value) : undefined })
          }
        />
      </div>
      <div className="space-y-2">
        <Label>Min discount (%)</Label>
        <Input
          type="number"
          placeholder="0"
          value={value.minDiscount ?? ""}
          onChange={(e) =>
            set({ minDiscount: e.target.value ? Number(e.target.value) : undefined })
          }
        />
      </div>
      <div className="space-y-2">
        <Label>Body type</Label>
        <Select
          value={value.bodyType ?? "all"}
          onValueChange={(v) => set({ bodyType: v === "all" ? undefined : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any body</SelectItem>
            {bodyTypes.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Exterior color</Label>
        <Select
          value={value.exteriorColor ?? "all"}
          onValueChange={(v) => set({ exteriorColor: v === "all" ? undefined : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any color</SelectItem>
            {exteriorColors.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Seller</Label>
        <Select
          value={value.sellerType ?? "all"}
          onValueChange={(v) =>
            set({
              sellerType:
                v === "all" ? undefined : (v as "Dealer" | "Individual"),
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Dealer or owner</SelectItem>
            <SelectItem value="Dealer">Dealer only</SelectItem>
            <SelectItem value="Individual">Owner only</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Fuel</Label>
        <Select
          value={value.fuel ?? "all"}
          onValueChange={(v) => set({ fuel: v === "all" ? undefined : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            {["Petrol", "Diesel", "CNG", "Electric", "Hybrid"].map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Transmission</Label>
        <Select
          value={value.transmission ?? "all"}
          onValueChange={(v) => set({ transmission: v === "all" ? undefined : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            {["Manual", "Automatic", "CVT", "DCT", "e-CVT"].map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Min year</Label>
          <Input
            type="number"
            placeholder="2015"
            value={value.minYear ?? ""}
            onChange={(e) =>
              set({ minYear: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Max year</Label>
          <Input
            type="number"
            placeholder="2026"
            value={value.maxYear ?? ""}
            onChange={(e) =>
              set({ maxYear: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Max owners</Label>
        <Select
          value={value.maxOwners != null ? String(value.maxOwners) : "all"}
          onValueChange={(v) =>
            set({ maxOwners: v === "all" ? undefined : Number(v) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            <SelectItem value="1">1</SelectItem>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3+</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>City</Label>
        <Input
          placeholder="Mumbai"
          value={value.city ?? ""}
          onChange={(e) => set({ city: e.target.value || undefined })}
          disabled={L.city != null}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="cert"
          type="checkbox"
          className="h-4 w-4 rounded border-border"
          checked={Boolean(value.certifiedOnly)}
          onChange={(e) => set({ certifiedOnly: e.target.checked })}
        />
        <Label htmlFor="cert" className="cursor-pointer">
          Certified only
        </Label>
      </div>
      <div className="space-y-2">
        <Label>Condition</Label>
        <Select
          value={
            value.isNew === true ? "new" : value.isNew === false ? "used" : "all"
          }
          onValueChange={(v) =>
            set({
              isNew: v === "new" ? true : v === "used" ? false : undefined,
            })
          }
          disabled={"isNew" in L}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="used">Used</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

const PAGE_SIZE = 24;

const NO_PATH_LOCK: Partial<CarFilters> = {};

export type CarsPageProps = {
  /** Base path for filter query navigation (e.g. /used-cars/mumbai/tata) */
  pathBase?: string;
  /** Facets fixed by the URL hierarchy (SEO) */
  lockedFilters?: Partial<CarFilters>;
  /** Small label above the title (defaults from condition lock). */
  pageEyebrow?: string;
  pageTitle?: string;
  pageSubtitle?: string;
  intro?: ReactNode;
  /** Filter/sort against this list instead of full inventory (e.g. shuffled explore catalog). */
  catalog?: readonly Car[];
};

export function CarsPage({
  pathBase = "/cars",
  lockedFilters,
  pageEyebrow,
  pageTitle,
  pageSubtitle,
  intro,
  catalog,
}: CarsPageProps = {}) {
  const router = useRouter();
  const sp = useSearchParams();
  const locked = useMemo(
    () => lockedFilters ?? NO_PATH_LOCK,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable SEO locks from route props
    [JSON.stringify(lockedFilters ?? null)]
  );
  const urlFilters = useMemo(() => {
    const parsed = parseFilters(sp);
    const merged: CarFilters = { ...parsed, ...locked };
    if (catalog != null && !sp.has("sort")) {
      merged.sort = "curated";
    }
    return merged;
  }, [sp, locked, catalog]);
  const [draft, setDraft] = useState<CarFilters>(urlFilters);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [filterBusy, setFilterBusy] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadLock = useRef(false);

  useEffect(() => {
    setDraft({ ...parseFilters(sp), ...locked });
  }, [sp, locked]);

  const sourceCatalog = catalog ?? cars;
  const filtered = useMemo(
    () => filterCars([...sourceCatalog], urlFilters),
    [sourceCatalog, urlFilters]
  );
  const filterKey = useMemo(() => JSON.stringify(urlFilters), [urlFilters]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setFilterBusy(true);
    const t = setTimeout(() => setFilterBusy(false), 160);
    return () => clearTimeout(t);
  }, [filterKey]);

  useEffect(() => {
    loadLock.current = false;
    const el = sentinelRef.current;
    if (!el || filtered.length === 0) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting || loadLock.current) return;
      loadLock.current = true;
      setVisibleCount((n) => {
        const next = Math.min(n + PAGE_SIZE, filtered.length);
        if (next > n) {
          trackEvent("cars_catalog_load_more", {
            event_category: GA_CATEGORIES.cars_catalog,
            visible_count: next,
            total_results: filtered.length,
            path_base: pathBase,
          });
        }
        return next;
      });
      window.setTimeout(() => {
        loadLock.current = false;
      }, 320);
    }, { rootMargin: "120px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [filterKey, filtered.length, pathBase]);

  function apply() {
    const merged = { ...draft, ...locked };
    const count = filterCars([...sourceCatalog], merged).length;
    trackEvent("cars_filter_apply", {
      event_category: GA_CATEGORIES.cars_catalog,
      ...carFiltersAnalyticsSummary(merged),
      result_count: count,
      path_base: pathBase,
    });
    const kw = merged.query?.trim();
    if (kw) {
      trackEvent("search", {
        event_category: GA_CATEGORIES.search,
        search_term: kw.slice(0, 100),
        path_base: pathBase,
      });
    }
    const p = filtersToParams(merged);
    router.push(`${pathBase}?${p.toString()}`);
  }

  function reset() {
    trackEvent("cars_filter_reset", {
      event_category: GA_CATEGORIES.cars_catalog,
      path_base: pathBase,
    });
    setDraft({ sort: "newest", ...locked });
    router.push(pathBase);
  }

  const resolvedEyebrow =
    pageEyebrow ??
    (locked.isNew === true ? "New cars" : locked.isNew === false ? "Pre-owned" : "Inventory");

  const lockedBrandForHeader =
    typeof locked.brand === "string" && locked.brand.trim() !== "" ? locked.brand : undefined;

  const isShowcaseHub =
    pathBase === "/cars" &&
    (!lockedFilters ||
      Object.entries(lockedFilters).every(([, v]) => v === undefined || v === null));

  const compareCount = useCompareStore((s) => s.variantIds.length);
  const deals = useMemo(() => getBestDeals(8), []);
  const inventoryStats = useMemo(() => {
    const prices = cars.map((c) => c.price);
    return {
      total: cars.length,
      cities: new Set(cars.map((c) => c.city)).size,
      brands: brands.length,
      evCount: cars.filter((c) => c.fuel === "Electric" || c.fuel === "Hybrid").length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
    };
  }, []);

  const filterChips = useMemo(() => activeFilterChips(urlFilters), [urlFilters]);

  function isLockedFilterKey(key: keyof CarFilters): boolean {
    if (!lockedFilters) return false;
    return (lockedFilters as Record<string, unknown>)[key as string] !== undefined;
  }

  function applyPreset(patch: Partial<CarFilters>) {
    const cur = parseFilters(new URLSearchParams(sp.toString()));
    const next = { ...cur, ...patch, ...locked };
    const count = filterCars([...sourceCatalog], next).length;
    trackEvent("cars_filter_preset", {
      event_category: GA_CATEGORIES.cars_catalog,
      preset_keys: Object.keys(patch).join(","),
      result_count: count,
      path_base: pathBase,
    });
    router.push(`${pathBase}?${filtersToParams(next).toString()}`);
  }

  function clearChip(key: keyof CarFilters) {
    const cur = parseFilters(new URLSearchParams(sp.toString()));
    const cleared = removeUrlFilter(cur, key);
    trackEvent("cars_filter_chip_clear", {
      event_category: GA_CATEGORIES.cars_catalog,
      filter_key: String(key),
      path_base: pathBase,
    });
    router.push(`${pathBase}?${filtersToParams({ ...cleared, ...locked }).toString()}`);
  }

  const filterSidebar = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Filters
        </h2>
        <SlidersHorizontal className="h-4 w-4 text-primary" />
      </div>
      <Separator />
      <FilterFields value={draft} onChange={setDraft} locked={locked} />
      <div className="flex flex-col gap-2 pt-2">
        <Button type="button" onClick={apply}>
          Apply filters
        </Button>
        <Button type="button" variant="outline" onClick={reset}>
          Reset
        </Button>
      </div>
    </div>
  );

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <Dialog
        onOpenChange={(open) => {
          if (open) {
            trackEvent("cars_mobile_filters_open", {
              event_category: GA_CATEGORIES.cars_catalog,
              path_base: pathBase,
            });
          }
        }}
      >
        <DialogTrigger asChild>
          <Button variant="outline" className="border-primary/25 lg:hidden">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          {filterSidebar}
        </DialogContent>
      </Dialog>
      <div className="flex rounded-2xl border border-border/80 bg-secondary/40 p-1 shadow-sm backdrop-blur-sm">
        <Button
          type="button"
          size="sm"
          variant={view === "grid" ? "secondary" : "ghost"}
          className="h-8 px-2.5"
          onClick={() => {
            setView("grid");
            trackEvent("cars_view_mode_change", {
              event_category: GA_CATEGORIES.cars_catalog,
              view_mode: "grid",
              path_base: pathBase,
            });
          }}
          aria-label="Grid view"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={view === "list" ? "secondary" : "ghost"}
          className="h-8 px-2.5"
          onClick={() => {
            setView("list");
            trackEvent("cars_view_mode_change", {
              event_category: GA_CATEGORIES.cars_catalog,
              view_mode: "list",
              path_base: pathBase,
            });
          }}
          aria-label="List view"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card/80 px-2 py-1 shadow-sm">
        <Label className="pl-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sort</Label>
        <Select
          value={urlFilters.sort ?? "newest"}
          onValueChange={(v) => {
            const sort = v as CarFilters["sort"];
            const current = parseFilters(new URLSearchParams(sp.toString()));
            const next = { ...current, sort, ...locked };
            const count = filterCars([...sourceCatalog], next).length;
            trackEvent("cars_sort_change", {
              event_category: GA_CATEGORIES.cars_catalog,
              sort,
              result_count: count,
              path_base: pathBase,
            });
            router.push(`${pathBase}?${filtersToParams(next).toString()}`);
          }}
        >
          <SelectTrigger className="h-8 w-[168px] border-0 bg-transparent shadow-none focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="curated">Mixed discovery</SelectItem>
            <SelectItem value="newest">Newest listed</SelectItem>
            <SelectItem value="price-asc">Price: low → high</SelectItem>
            <SelectItem value="price-desc">Price: high → low</SelectItem>
            <SelectItem value="emi-asc">EMI: low → high</SelectItem>
            <SelectItem value="discount-desc">Highest discount</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <PageFade>
      {isShowcaseHub ? (
        <section className="relative overflow-hidden border-b border-border bg-background">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute inset-0 bg-linear-to-br from-primary/7 via-transparent to-secondary/80" />
            <div className="cars-browse-page-orb cars-browse-page-orb-a" />
            <div className="cars-browse-page-orb cars-browse-page-orb-b" />
          </div>
          <div className="relative z-1 mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
            <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
              <div className="lg:col-span-7">
                <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                  {resolvedEyebrow}
                </span>
                <h1 className="font-display mt-5 text-balance text-[1.85rem] font-bold leading-[1.12] tracking-tight text-foreground sm:text-4xl lg:text-[2.65rem] lg:leading-[1.1]">
                  {pageTitle ?? "Every listing, one calm grid"}
                </h1>
                <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-[1.0625rem]">
                  {pageSubtitle ??
                    "Filter like a power user — then save, compare, and open any car for the full spec sheet, history, and dealer context."}
                </p>

                <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                  {[
                    { v: inventoryStats.total.toLocaleString("en-IN"), l: "Live listings", hint: "In this catalog" },
                    { v: String(inventoryStats.brands), l: "Brands", hint: "Pan-India mix" },
                    { v: String(inventoryStats.cities), l: "Cities", hint: "Coverage" },
                    { v: String(inventoryStats.evCount), l: "EV & hybrid", hint: "Alt-fuel" },
                  ].map((s) => (
                    <div
                      key={s.l}
                      className="rounded-2xl border border-border/80 bg-card/90 p-4 shadow-sm ring-1 ring-foreground/[0.04] backdrop-blur-sm"
                    >
                      <dt className="sr-only">{s.l}</dt>
                      <dd className="font-display text-2xl font-semibold tabular-nums text-primary sm:text-[1.65rem]">
                        {s.v}
                      </dd>
                      <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground">{s.l}</p>
                      <p className="mt-0.5 hidden text-[10px] text-muted-foreground sm:block">{s.hint}</p>
                    </div>
                  ))}
                </dl>
                <p className="mt-6 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground/90">Typical price band:</span>{" "}
                  <span className="font-semibold text-foreground">
                    {formatINR(inventoryStats.minPrice)} – {formatINR(inventoryStats.maxPrice)}
                  </span>
                </p>
              </div>

              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_16px_48px_-28px_rgba(15,23,42,0.25)] ring-1 ring-foreground/[0.04] sm:p-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Layout & sort
                  </p>
                  <div className="mt-4 flex flex-col gap-3">{toolbar}</div>
                  <Separator className="my-5 bg-border/80" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Also try</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="rounded-full border-border shadow-sm" asChild>
                      <Link
                        href="/compare"
                        onClick={() =>
                          trackEvent("cta_click", {
                            event_category: GA_CATEGORIES.navigation,
                            event_label: "compare",
                            link_href: "/compare",
                            section: "cars_hero_shortcuts",
                          })
                        }
                      >
                        <GitCompare className="h-3.5 w-3.5" />
                        Compare
                        {compareCount > 0 ? (
                          <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                            {compareCount}
                          </span>
                        ) : null}
                      </Link>
                    </Button>
                    {/* <Button variant="outline" size="sm" className="rounded-full border-border shadow-sm" asChild>
                      <Link href="/test-drive">
                        <CarFront className="h-3.5 w-3.5" />
                        Test drive
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-full border-border shadow-sm" asChild>
                      <Link href="/companies">
                        <Building2 className="h-3.5 w-3.5" />
                        Dealers
                      </Link>
                    </Button> */}
                    <Button variant="outline" size="sm" className="rounded-full border-border shadow-sm" asChild>
                      <Link
                        href="/brands"
                        onClick={() =>
                          trackEvent("cta_click", {
                            event_category: GA_CATEGORIES.navigation,
                            event_label: "all_brands",
                            link_href: "/brands",
                            section: "cars_hero_shortcuts",
                          })
                        }
                      >
                        <Tags className="h-3.5 w-3.5" />
                        All brands
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <CarsBrowseExploreSection applyPreset={applyPreset} />
          </div>
        </section>
      ) : (
        <section className="border-b border-border bg-linear-to-b from-secondary/55 via-background to-background">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{resolvedEyebrow}</p>
                <h1 className="mt-2 flex flex-wrap items-center gap-3 text-3xl font-bold tracking-tight text-foreground sm:gap-3.5 sm:text-4xl">
                  {lockedBrandForHeader ? (
                    <BrandLogo brand={lockedBrandForHeader} size={44} className="shrink-0 rounded-xl shadow-sm" />
                  ) : null}
                  <span className="min-w-0">{pageTitle ?? "Browse inventory"}</span>
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {pageSubtitle ??
                    `${sourceCatalog.length.toLocaleString("en-IN")}+ live listings — infinite scroll, grid or list, sticky filters with motion.`}
                </p>
                {intro ? (
                  <div className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{intro}</div>
                ) : null}
              </div>
              {toolbar}
            </div>
          </div>
        </section>
      )}

      {isShowcaseHub ? (
        <section className="border-b border-border bg-secondary/35 py-12 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Highlights</p>
                <h2 className="font-display mt-2 text-xl font-semibold text-foreground sm:text-2xl">
                  Largest discounts right now
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Same listing cards as below — swipe horizontally on small screens.
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-fit rounded-full border-primary/25 shadow-sm" asChild>
                <Link
                  href="/compare"
                  onClick={() =>
                    trackEvent("cta_click", {
                      event_category: GA_CATEGORIES.navigation,
                      event_label: "open_compare_tray",
                      link_href: "/compare",
                      section: "cars_highlights",
                    })
                  }
                >
                  Open compare tray
                </Link>
              </Button>
            </div>
            <div className="relative mt-8 rounded-2xl border border-border/80 bg-card/80 p-4 shadow-inner ring-1 ring-foreground/[0.03] sm:p-5">
              <div className="flex gap-4 overflow-x-auto pb-1 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] snap-x snap-mandatory sm:gap-5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent">
                {deals.map((car, i) => (
                  <div
                    key={car.id}
                    className="flex min-h-0 w-[min(100%,300px)] shrink-0 snap-start self-stretch sm:w-[280px]"
                  >
                    <CarCard car={car} index={i} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {isShowcaseHub && urlFilters.query ? (
          <p className="pt-8 text-xs text-primary">
            Keyword filter: <span className="font-semibold">&ldquo;{urlFilters.query}&rdquo;</span>
          </p>
        ) : null}

        {isShowcaseHub ? (
          <div
            className={cn(
              "border-b border-border/70 pb-8",
              urlFilters.query?.trim()
                ? "pt-4"
                : filterChips.length > 0
                  ? "pt-8"
                  : "pt-10"
            )}
          >
            <h2 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Browse inventory
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Filters on the left refine this grid on desktop; use <span className="font-medium text-foreground">Filters</span>{" "}
              on smaller screens. Sort and view mode match the controls in the hero.
            </p>
          </div>
        ) : null}

        {filterChips.length > 0 ? (
          <div className={`flex flex-wrap items-center gap-2 ${isShowcaseHub ? "pt-6" : "pt-8"}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active</span>
            {filterChips.map((chip) => {
              const lockedChip = isLockedFilterKey(chip.key);
              return (
                <span
                  key={`${chip.key}-${chip.label}`}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-foreground"
                >
                  {chip.label}
                  {!lockedChip ? (
                    <button
                      type="button"
                      onClick={() => clearChip(chip.key)}
                      className="rounded-full p-0.5 text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                      aria-label={`Remove filter ${chip.label}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  ) : null}
                </span>
              );
            })}
          </div>
        ) : null}

        <div
          className={cn(
            /* Default lg:items-stretch so aside matches main column height — required for sticky expert while scrolling long grids (e.g. /cars/explore). */
            "flex flex-col gap-10 pb-12 lg:flex-row",
            isShowcaseHub ? "pt-8" : "pt-10"
          )}
        >
          <aside className="hidden w-72 shrink-0 lg:flex lg:flex-col lg:gap-5">
            <div className="glass-card shrink-0 rounded-2xl p-5">{filterSidebar}</div>
            <div className="sticky top-24 z-30 w-full">
              <HomeExpertBookCta
                variant="sidebar"
                trackSource="cars_listing_sidebar"
                className="shadow-lg"
              />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-8 lg:hidden">
              <HomeExpertBookCta variant="compact" trackSource="cars_listing_mobile" />
            </div>
            {filterBusy ? <CarsGridSkeleton /> : null}
            {!filterBusy && filtered.length === 0 ? <CarsEmptyState /> : null}
            {!filterBusy && filtered.length > 0 ? (
              <>
                <p className="mb-6 text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-semibold text-foreground">
                    {Math.min(visibleCount, filtered.length)}
                  </span>{" "}
                  of <span className="font-semibold text-foreground">{filtered.length}</span> vehicles
                </p>
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={view}
                    layout
                    initial={{ opacity: 0.85 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0.85 }}
                    transition={{ duration: 0.2 }}
                    className={
                      view === "grid"
                        ? "grid auto-rows-fr gap-6 sm:grid-cols-2 xl:grid-cols-3"
                        : "flex flex-col gap-4"
                    }
                  >
                    {filtered.slice(0, visibleCount).map((car, i) => (
                      <div key={car.id} className={view === "grid" ? "min-h-0" : undefined}>
                        <CarCard car={car} index={i} variant={view} />
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>
                {visibleCount < filtered.length ? (
                  <div ref={sentinelRef} className="flex justify-center py-12">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                  </div>
                ) : (
                  <p className="py-8 text-center text-xs text-muted-foreground">End of results</p>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </PageFade>
  );
}
