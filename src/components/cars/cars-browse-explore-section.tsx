"use client";

import { useMemo, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  BadgePercent,
  Banknote,
  Bolt,
  Car,
  CarFront,
  Gauge,
  IndianRupee,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cars, brands } from "@/data";
import type { CarFilters } from "@/data";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brands/brand-logo";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { GA_CATEGORIES, trackEvent } from "@/lib/analytics";

const QUICK_PRESETS: { label: string; patch: Partial<CarFilters>; Icon: LucideIcon }[] = [
  { label: "SUV", patch: { bodyType: "SUV" }, Icon: Truck },
  { label: "Hatchback", patch: { bodyType: "Hatchback" }, Icon: Car },
  { label: "Sedan", patch: { bodyType: "Sedan" }, Icon: CarFront },
  { label: "Electric", patch: { fuel: "Electric" }, Icon: Bolt },
  { label: "Automatic", patch: { transmission: "Automatic" }, Icon: Gauge },
  { label: "Under ₹10 lakh", patch: { maxPrice: 1_000_000 }, Icon: IndianRupee },
  { label: "Under ₹15 lakh", patch: { maxPrice: 1_500_000 }, Icon: Banknote },
  { label: "Dealer stock", patch: { sellerType: "Dealer" }, Icon: Store },
  { label: "Certified", patch: { certifiedOnly: true }, Icon: ShieldCheck },
  { label: "Top deals", patch: { sort: "discount-desc" }, Icon: BadgePercent },
];

function bodyTypeToCarIcon(bodyType: string): LucideIcon {
  const b = bodyType.toLowerCase();
  if (b.includes("suv") || b.includes("7-seater")) return Truck;
  if (b.includes("hatch")) return Car;
  if (b.includes("sedan") || b.includes("5-seater")) return CarFront;
  return CarFront;
}

function useBrandListingStats() {
  return useMemo(() => {
    const byBrand = new Map<string, number>();
    const bodyTallyByBrand = new Map<string, Map<string, number>>();

    for (const c of cars) {
      byBrand.set(c.brand, (byBrand.get(c.brand) ?? 0) + 1);

      if (!bodyTallyByBrand.has(c.brand)) bodyTallyByBrand.set(c.brand, new Map());
      const bm = bodyTallyByBrand.get(c.brand)!;
      bm.set(c.bodyType, (bm.get(c.bodyType) ?? 0) + 1);
    }

    function dominant(m: Map<string, number>): string {
      let best = "Sedan";
      let max = 0;
      for (const [bt, n] of m) {
        if (n > max) {
          max = n;
          best = bt;
        }
      }
      return best;
    }

    const dominantBodyBrand = new Map<string, string>();
    for (const [brand, tally] of bodyTallyByBrand) {
      dominantBodyBrand.set(brand, dominant(tally));
    }

    const topBrands = [...brands]
      .sort((a, b) => (byBrand.get(b) ?? 0) - (byBrand.get(a) ?? 0))
      .slice(0, 12);

    return { byBrand, dominantBodyBrand, topBrands };
  }, []);
}

const scrollRowClass =
  "flex gap-3 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:thin] snap-x snap-mandatory scroll-pl-5 sm:scroll-pl-7 lg:scroll-pl-8 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent";

function ScrollStrip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("-mx-5 px-5 sm:-mx-7 sm:px-7 lg:-mx-8 lg:px-8", className)}>
      <div className={scrollRowClass}>{children}</div>
    </div>
  );
}

export function CarsBrowseExploreSection({
  applyPreset,
}: {
  applyPreset: (patch: Partial<CarFilters>) => void;
}) {
  const reduceMotion = useReducedMotion();
  const { byBrand, dominantBodyBrand, topBrands } = useBrandListingStats();

  return (
    <div className="relative mt-14">
      <div className="pointer-events-none absolute -inset-x-6 -inset-y-8 overflow-hidden sm:-inset-x-10" aria-hidden>
        <div className="cars-browse-explore-orb-a absolute -left-[12%] top-1/2 h-[min(52vw,28rem)] w-[min(52vw,28rem)] -translate-y-1/2 rounded-full bg-primary/12 blur-3xl" />
        <div className="cars-browse-explore-orb-b absolute -right-[8%] -top-[20%] h-[min(48vw,24rem)] w-[min(48vw,24rem)] rounded-full bg-zinc-400/10 blur-3xl" />
        <div className="cars-browse-explore-orb-c absolute bottom-[-18%] left-[35%] h-[min(40vw,18rem)] w-[min(40vw,18rem)] rounded-full bg-zinc-500/8 blur-3xl" />
        <div className="cars-browse-explore-mesh absolute inset-0 opacity-[0.45]" />
      </div>

      <div className="relative overflow-hidden rounded-[1.65rem] border border-border/80 bg-card/75 shadow-app-soft ring-1 ring-foreground/4 backdrop-blur-md sm:rounded-[1.85rem]">
        <Car
          className={cn(
            "pointer-events-none absolute -left-4 top-[18%] h-28 w-28 text-primary opacity-[0.06] sm:h-36 sm:w-36",
            !reduceMotion && "cars-browse-deco-drift-a"
          )}
          aria-hidden
        />
        <Truck
          className={cn(
            "pointer-events-none absolute -right-6 bottom-[22%] h-32 w-32 text-primary opacity-[0.05] sm:h-40 sm:w-40",
            !reduceMotion && "cars-browse-deco-drift-b"
          )}
          aria-hidden
        />
        <CarFront
          className={cn(
            "pointer-events-none absolute left-[42%] top-2 h-20 w-20 text-zinc-500 opacity-[0.05]",
            !reduceMotion && "cars-browse-deco-drift-c"
          )}
          aria-hidden
        />

        <div className="relative border-b border-border/60 bg-linear-to-r from-zinc-500/5 via-transparent to-zinc-400/4 px-5 py-5 sm:px-8 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Explore faster
              </p>
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-[1.65rem]">
                Shortcuts &amp; popular brands
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                Swipe horizontally for more. One tap applies filters to the grid below. Brands are ranked by listing
                count; the small icon is the most common body style for that maker in this catalog.
              </p>
            </div>
            <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary shadow-sm">
              <Zap className="h-3.5 w-3.5" aria-hidden />
              Instant apply
            </span>
          </div>
        </div>

        <div className="relative space-y-8 p-5 sm:p-7 lg:p-8">
          {/* Shortcuts — horizontal scroll */}
          <div>
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary shadow-inner ring-1 ring-primary/10">
                <Gauge className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-base font-semibold text-foreground sm:text-lg">Shortcuts</h3>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground sm:text-sm">
                  Body, fuel, price band, and more — scroll sideways on small screens.
                </p>
              </div>
            </div>
            <ScrollStrip className="mt-4">
              {QUICK_PRESETS.map((p, idx) => {
                const PresetIcon = p.Icon;
                return (
                  <motion.button
                    key={p.label}
                    type="button"
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-20px" }}
                    transition={{ delay: Math.min(idx * 0.03, 0.24), duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={reduceMotion ? {} : { y: -2 }}
                    whileTap={reduceMotion ? {} : { scale: 0.99 }}
                    onClick={() => {
                      trackEvent("cars_explore_preset_click", {
                        event_category: GA_CATEGORIES.cars_catalog,
                        preset_label: p.label,
                      });
                      applyPreset(p.patch);
                    }}
                    className={cn(
                      "group flex min-h-[5.25rem] w-[9.75rem] shrink-0 snap-start flex-col items-start justify-center gap-2 rounded-2xl border border-border/90 bg-linear-to-b from-card to-secondary/50 p-3.5 text-left shadow-sm ring-1 ring-foreground/2 transition sm:w-[10.25rem] sm:p-4",
                      "hover:border-primary/35 hover:shadow-md hover:shadow-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                    )}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/16 group-hover:shadow-sm">
                      <PresetIcon className="h-[1.15rem] w-[1.15rem]" strokeWidth={2} aria-hidden />
                    </span>
                    <span className="text-left text-[12px] font-semibold leading-snug text-foreground sm:text-[13px]">
                      {p.label}
                    </span>
                  </motion.button>
                );
              })}
            </ScrollStrip>
          </div>

          {/* Popular brands — horizontal scroll */}
          <div>
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-500/10 text-zinc-700 dark:text-zinc-400">
                <CarFront className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-base font-semibold text-foreground sm:text-lg">Popular brands</h3>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground sm:text-sm">
                  Sorted by listings here — swipe to see more makers.
                </p>
              </div>
            </div>
            <div className="-mx-5 mt-4 px-5 sm:-mx-7 sm:px-7 lg:-mx-8 lg:px-8">
              <ul className={cn(scrollRowClass, "list-none")} role="list">
                {topBrands.map((b) => {
                  const n = byBrand.get(b) ?? 0;
                  const body = dominantBodyBrand.get(b) ?? "Sedan";
                  const BodyIcon = bodyTypeToCarIcon(body);
                  return (
                    <li key={b} className="shrink-0 snap-start">
                      <button
                        type="button"
                        onClick={() => {
                          trackEvent("cars_explore_brand_chip", {
                            event_category: GA_CATEGORIES.cars_catalog,
                            brand: b,
                            listing_count: n,
                          });
                          applyPreset({ brand: b });
                        }}
                        className={cn(
                          "flex h-full min-h-[4.5rem] w-[min(17.5rem,calc(100vw-3rem))] min-w-[15rem] items-center gap-3 rounded-2xl border border-border/80 bg-secondary/35 py-2.5 pl-2.5 pr-3 text-left shadow-sm ring-1 ring-transparent transition sm:min-w-[16.5rem]",
                          "hover:border-primary/30 hover:bg-card hover:shadow-md hover:ring-primary/10"
                        )}
                      >
                        <BrandLogo brand={b} size={40} className="shrink-0 rounded-lg shadow-sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-foreground">{b}</span>
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {n.toLocaleString("en-IN")} listing{n === 1 ? "" : "s"}
                          </span>
                        </span>
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card/90 text-primary/90 shadow-inner"
                          title={`Common body: ${body}`}
                        >
                          <BodyIcon className="h-4 w-4" aria-hidden />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
