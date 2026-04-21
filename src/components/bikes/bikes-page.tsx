"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { bikes } from "@/data";
import type { Bike } from "@/data/types";
import { bikePath } from "@/lib/seo/bike-paths";
import { formatINR } from "@/lib/utils";
import { useBikeCompareStore } from "@/stores/bike-compare-store";
import { PageFade } from "@/components/shared/page-fade";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RemoteImageWithFallback } from "@/components/ui/remote-image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BrandLogo } from "@/components/brands/brand-logo";
import { HomeExpertBookCta } from "@/components/home/home-expert-book-cta";

type BikeSort = "newest" | "price-asc" | "price-desc" | "mileage-desc";
type BikeFilters = {
  q?: string;
  brand?: string;
  city?: string;
  fuel?: "Petrol" | "Electric";
  bodyType?: Bike["bodyType"];
  maxPrice?: number;
  sort?: BikeSort;
};

function parseFilters(sp: URLSearchParams): BikeFilters {
  const maxPriceRaw = sp.get("maxPrice");
  const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : undefined;
  const sortRaw = sp.get("sort");
  const sort: BikeSort =
    sortRaw === "price-asc" || sortRaw === "price-desc" || sortRaw === "mileage-desc" ? sortRaw : "newest";
  const fuel = sp.get("fuel");
  return {
    q: sp.get("q") || undefined,
    brand: sp.get("brand") || undefined,
    city: sp.get("city") || undefined,
    fuel: fuel === "Petrol" || fuel === "Electric" ? fuel : undefined,
    bodyType: (sp.get("bodyType") as Bike["bodyType"] | null) ?? undefined,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    sort,
  };
}

function filtersToParams(f: BikeFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.brand) p.set("brand", f.brand);
  if (f.city) p.set("city", f.city);
  if (f.fuel) p.set("fuel", f.fuel);
  if (f.bodyType) p.set("bodyType", f.bodyType);
  if (f.maxPrice != null) p.set("maxPrice", String(f.maxPrice));
  if (f.sort) p.set("sort", f.sort);
  return p;
}

function filterBikes(list: Bike[], f: BikeFilters): Bike[] {
  let out = [...list];
  if (f.q) {
    const qq = f.q.toLowerCase();
    out = out.filter((b) => `${b.brand} ${b.model} ${b.variant} ${b.city} ${b.bodyType}`.toLowerCase().includes(qq));
  }
  if (f.brand) out = out.filter((b) => b.brand === f.brand);
  if (f.city) {
    const city = f.city;
    out = out.filter((b) => b.city.toLowerCase() === city.toLowerCase());
  }
  if (f.fuel) out = out.filter((b) => b.fuel === f.fuel);
  if (f.bodyType) out = out.filter((b) => b.bodyType === f.bodyType);
  if (f.maxPrice != null) {
    const max = f.maxPrice;
    out = out.filter((b) => b.price <= max);
  }
  if (f.sort === "price-asc") out.sort((a, b) => a.price - b.price);
  else if (f.sort === "price-desc") out.sort((a, b) => b.price - a.price);
  else if (f.sort === "mileage-desc") out.sort((a, b) => b.mileageKmpl - a.mileageKmpl);
  else out.sort((a, b) => b.year - a.year);
  return out;
}

function BikeCard({ bike, index = 0, view = "grid" }: { bike: Bike; index?: number; view?: "grid" | "list" }) {
  const has = useBikeCompareStore((s) => s.has(bike.id));
  const add = useBikeCompareStore((s) => s.add);
  const remove = useBikeCompareStore((s) => s.remove);
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.03 }}
      className={`group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:border-primary/25 hover:shadow-md ${
        view === "list" ? "flex flex-col sm:flex-row" : ""
      }`}
    >
      <div className={`relative overflow-hidden bg-secondary/20 ${view === "list" ? "h-40 sm:h-auto sm:w-72" : "aspect-[16/10]"}`}>
        <RemoteImageWithFallback src={bike.image} alt="" fill className="object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <CardContent className="flex-1 space-y-2 p-4">
        <p className="inline-flex items-center gap-2 text-lg font-semibold text-foreground">
          <BrandLogo brand={bike.brand} size={22} />
          {bike.brand} {bike.model}
        </p>
        <p className="text-sm text-muted-foreground">{bike.variant}</p>
        <p className="text-sm font-bold text-primary">{formatINR(bike.price)}</p>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-lg bg-secondary/70 px-2 py-1">{bike.bodyType}</span>
          <span className="rounded-lg bg-secondary/70 px-2 py-1">{bike.fuel}</span>
          <span className="rounded-lg bg-secondary/70 px-2 py-1">{bike.engineCc ? `${bike.engineCc}cc` : "Electric"}</span>
          <span className="rounded-lg bg-secondary/70 px-2 py-1">{bike.city}</span>
        </div>
        <Button size="sm" variant="listing" className="mt-2" asChild>
          <Link href={bikePath(bike)}>View details</Link>
        </Button>
        <Button
          size="sm"
          variant={has ? "secondary" : "outline"}
          className="mt-2 ml-2"
          onClick={() => (has ? remove(bike.id) : add(bike.id))}
        >
          {has ? "Added to compare" : "Add to compare"}
        </Button>
      </CardContent>
    </motion.article>
  );
}

export function BikesPage({
  pageTitle = "Browse bikes",
  pageSubtitle = "City commuters, sports bikes, cruisers, EV scooters — all in one clean grid.",
  intro,
}: {
  pageTitle?: string;
  pageSubtitle?: string;
  intro?: ReactNode;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const filters = useMemo(() => parseFilters(sp), [sp]);
  const [draft, setDraft] = useState<BikeFilters>(filters);
  const [view, setView] = useState<"grid" | "list">("grid");
  const out = useMemo(() => filterBikes(bikes, filters), [filters]);
  const compareIds = useBikeCompareStore((s) => s.ids);
  const brandOpts = useMemo(() => [...new Set(bikes.map((b) => b.brand))].sort(), []);
  const cityOpts = useMemo(() => [...new Set(bikes.map((b) => b.city))].sort(), []);
  const bodyOpts = useMemo(() => [...new Set(bikes.map((b) => b.bodyType))].sort(), []);
  const brandCounts = useMemo(
    () =>
      brandOpts.map((brand) => ({
        brand,
        count: bikes.filter((b) => b.brand === brand).length,
      })),
    [brandOpts],
  );
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const pageCount = Math.max(1, Math.ceil(out.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = out.slice((safePage - 1) * pageSize, safePage * pageSize);

  function apply() {
    router.push(`/bikes?${filtersToParams(draft).toString()}`);
  }
  function reset() {
    setDraft({ sort: "newest" });
    router.push("/bikes");
  }

  const filterUi = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Filters</p>
        <SlidersHorizontal className="h-4 w-4 text-primary" />
      </div>
      <div className="space-y-2">
        <Label>Search</Label>
        <Input value={draft.q ?? ""} onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value || undefined }))} placeholder="Brand, model, city…" />
      </div>
      <div className="space-y-2">
        <Label>Brand</Label>
        <Select value={draft.brand ?? "all"} onValueChange={(v) => setDraft((d) => ({ ...d, brand: v === "all" ? undefined : v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All brands</SelectItem>
            {brandOpts.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>City</Label>
        <Select value={draft.city ?? "all"} onValueChange={(v) => setDraft((d) => ({ ...d, city: v === "all" ? undefined : v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {cityOpts.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Body type</Label>
        <Select value={draft.bodyType ?? "all"} onValueChange={(v) => setDraft((d) => ({ ...d, bodyType: v === "all" ? undefined : (v as Bike["bodyType"]) }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {bodyOpts.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Fuel</Label>
        <Select value={draft.fuel ?? "all"} onValueChange={(v) => setDraft((d) => ({ ...d, fuel: v === "all" ? undefined : (v as "Petrol" | "Electric") }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Petrol">Petrol</SelectItem>
            <SelectItem value="Electric">Electric</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Max price (₹)</Label>
        <Input type="number" value={draft.maxPrice ?? ""} onChange={(e) => setDraft((d) => ({ ...d, maxPrice: e.target.value ? Number(e.target.value) : undefined }))} />
      </div>
      <div className="flex gap-2">
        <Button onClick={apply} className="flex-1">Apply</Button>
        <Button variant="outline" onClick={reset} className="flex-1">Reset</Button>
      </div>
    </div>
  );

  return (
    <PageFade>
      <section className="border-b border-border bg-gradient-to-b from-secondary/70 to-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Two-wheelers</p>
              <h1 className="font-display mt-2 text-3xl tracking-tight text-foreground sm:text-4xl">{pageTitle}</h1>
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">{pageSubtitle}</p>
              {intro ? <div className="mt-3 text-sm text-muted-foreground">{intro}</div> : null}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" asChild>
                <Link href="/bikes/compare">Bike compare ({compareIds.length})</Link>
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="lg:hidden"><Filter className="h-4 w-4" />Filters</Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Bike filters</DialogTitle></DialogHeader>
                  {filterUi}
                </DialogContent>
              </Dialog>
              <Button size="icon" variant={view === "grid" ? "secondary" : "outline"} onClick={() => setView("grid")} aria-label="Grid">
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button size="icon" variant={view === "list" ? "secondary" : "outline"} onClick={() => setView("list")} aria-label="List">
                <List className="h-4 w-4" />
              </Button>
              <div className="hidden items-center gap-2 sm:flex">
                <Label className="text-xs text-muted-foreground">Sort</Label>
                <Select value={filters.sort ?? "newest"} onValueChange={(v) => router.push(`/bikes?${filtersToParams({ ...filters, sort: v as BikeSort }).toString()}`)}>
                  <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-asc">Price low-high</SelectItem>
                    <SelectItem value="price-desc">Price high-low</SelectItem>
                    <SelectItem value="mileage-desc">Mileage high-low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground">Browse by bike company</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {brandCounts.map((x) => (
              <Button
                key={x.brand}
                variant={filters.brand === x.brand ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  const next = { ...filters, brand: x.brand };
                  setDraft(next);
                  setPage(1);
                  router.push(`/bikes?${filtersToParams(next).toString()}`);
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <BrandLogo brand={x.brand} size={18} />
                  {x.brand} ({x.count})
                </span>
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={reset}>
              Clear brand filter
            </Button>
          </div>
        </div>
        <div className="flex gap-10 lg:flex-row">
          <aside className="hidden w-72 shrink-0 lg:flex lg:flex-col lg:gap-5">
            <div className="shrink-0 rounded-2xl border border-border bg-card p-5">{filterUi}</div>
            <div className="sticky top-24 z-30 w-full">
              <HomeExpertBookCta
                variant="sidebar"
                trackSource="bikes_listing_sidebar"
                className="shadow-lg"
              />
            </div>
          </aside>
          <div className="min-w-0 flex-1">
            <div className="mb-8 lg:hidden">
              <HomeExpertBookCta variant="compact" trackSource="bikes_listing_mobile" />
            </div>
            <p className="mb-5 text-sm text-muted-foreground">{out.length} bikes</p>
            {out.length === 0 ? (
              <Card className="border-dashed border-border"><CardContent className="py-16 text-center text-muted-foreground">No bikes match current filters.</CardContent></Card>
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.div key={view} layout className={view === "grid" ? "grid gap-6 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4"}>
                  {paged.map((b, i) => <BikeCard key={b.id} bike={b} index={i} view={view} />)}
                </motion.div>
              </AnimatePresence>
            )}
            {pageCount > 1 ? (
              <div className="mt-8 flex items-center justify-center gap-3">
                <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Previous
                </Button>
                <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                  Page {safePage} / {pageCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </PageFade>
  );
}

