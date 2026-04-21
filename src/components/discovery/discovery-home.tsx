"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { cars } from "@/data";
import { GA_CATEGORIES, trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import { HomeExpertBookCta } from "@/components/home/home-expert-book-cta";
import { HomeIdgFullVideoBand } from "@/components/home/home-idg-full-video";
import { HomePageAmbient } from "@/components/home/home-page-ambient";
import { HomeHeroSection } from "@/components/discovery/home-hero-section";
import { usePreferenceFinderStore } from "@/stores/preference-finder-store";
import { advisorResultsMeta, normalizeAdvisorResultsToMatches } from "@/lib/advisor-results-normalize";
import { AiMatchedCarCard } from "@/components/discovery/ai-matched-car-card";
import { DiscoveryHomeBootstrapLoader } from "@/components/discovery/discovery-home-bootstrap-loader";
import { DiscoveryCatalogueTrending } from "@/components/discovery/discovery-catalogue-trending";
import { HomeBrowseMarketplace } from "@/components/home/home-browse-marketplace";
import { HomePlatformHighlights } from "@/components/home/home-platform-highlights";

type SortBy = "price-asc" | "price-desc" | "mileage" | "popularity";

export function DiscoveryHome() {
  const reduceMotion = useReducedMotion();
  const allCities = useMemo(() => Array.from(new Set(cars.map((c) => c.city))).sort(), []);
  const [sort, setSort] = useState<SortBy>("popularity");
  const [visibleCount, setVisibleCount] = useState(6);
  const promptSnapshot = usePreferenceFinderStore((s) => s.promptSnapshot);
  const advisorResultsPayload = usePreferenceFinderStore((s) => s.advisorResults);
  const bootstrapping = usePreferenceFinderStore((s) => s.bootstrapping);
  const submitting = usePreferenceFinderStore((s) => s.submitting);

  const matchRows = useMemo(() => normalizeAdvisorResultsToMatches(advisorResultsPayload), [advisorResultsPayload]);

  const resultsMeta = useMemo(() => advisorResultsMeta(advisorResultsPayload), [advisorResultsPayload]);

  const loading = bootstrapping || submitting;

  const filtered = useMemo(() => {
    const list = [...matchRows];
    if (sort === "price-asc") list.sort((a, b) => (a.sortPriceMin || 0) - (b.sortPriceMin || 0));
    if (sort === "price-desc") list.sort((a, b) => (b.sortPriceMax || 0) - (a.sortPriceMax || 0));
    if (sort === "popularity") list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    if (sort === "mileage") list.sort((a, b) => (b.mileageKmpl ?? 0) - (a.mileageKmpl ?? 0));
    return list;
  }, [matchRows, sort]);

  const displayMatchCount = resultsMeta.totalMatches ?? filtered.length;
  const hasMatches = filtered.length > 0;

  const recommendationLine = useMemo(() => {
    if (!promptSnapshot.city || !promptSnapshot.body || !promptSnapshot.fuel || !promptSnapshot.budget) {
      return "Finish the questionnaire to refresh your match list from the catalogue.";
    }
    return `Showing matches for ${promptSnapshot.city}, ${promptSnapshot.body}, ${promptSnapshot.fuel}, and ${promptSnapshot.budget}. Change sort below anytime.`;
  }, [promptSnapshot]);

  const scrollToMatches = () => {
    document.getElementById("ai-matched-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    trackEvent("preference_view_matches_click", { event_category: GA_CATEGORIES.home });
  };

  return (
    <div className="relative min-h-screen bg-background">
      <DiscoveryHomeBootstrapLoader />
      <HomePageAmbient />
      <HomeHeroSection
        reduceMotion={reduceMotion}
        allCities={allCities}
        recommendationLine={recommendationLine}
        onViewMatches={scrollToMatches}
      />

      {hasMatches ? (
        <section className="relative z-[1] mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-8 lg:px-8">
          <div
            id="ai-matched-results"
            className="scroll-mt-20 sm:scroll-mt-24"
            aria-label="Matched car results"
          >
            <div className="relative overflow-hidden rounded-[1.35rem] border border-border/80 bg-card p-6 shadow-premium ring-1 ring-foreground/[0.04] sm:p-8 lg:p-10">
              <div
                className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-primary/[0.06] blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-zinc-400/[0.07] blur-3xl"
                aria-hidden
              />
              <div className="relative">
              <div className="mb-8 flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
                <div className="min-w-0 space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-foreground/70" aria-hidden />
                    {!loading ? (
                      <span>
                        <span className="tabular-nums text-foreground">{displayMatchCount}</span>
                        {" live match"}
                        {displayMatchCount === 1 ? "" : "es"}
                      </span>
                    ) : (
                      "Updating matches…"
                    )}
                  </div>
                  <div className="space-y-2">
                    <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                      Your matched cars
                    </h2>
                    <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                      {recommendationLine}
                    </p>
                    {resultsMeta.aiSummary ? (
                      <p className="max-w-2xl border-l-2 border-border pl-4 text-sm leading-relaxed text-foreground sm:text-[0.9375rem]">
                        {resultsMeta.aiSummary}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex w-full shrink-0 flex-col gap-2 lg:w-[min(100%,280px)]">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Sort by
                  </span>
                  <Select
                    value={sort}
                    onValueChange={(v) => {
                      setSort(v as SortBy);
                      trackEvent("sort_change", { event_category: GA_CATEGORIES.home, sort: v });
                    }}
                  >
                    <SelectTrigger
                      id="matched-cars-sort"
                      aria-label="Sort matched cars"
                      className={cn(
                        "h-11 w-full cursor-pointer rounded-xl border border-border bg-background px-3.5 text-left text-sm font-medium text-foreground shadow-sm",
                        "transition-colors hover:border-border hover:bg-muted/30",
                        "focus:ring-2 focus:ring-ring/35 focus:ring-offset-0",
                        "[&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0 [&>svg]:text-foreground/70 [&>svg]:opacity-100"
                      )}
                    >
                      <SelectValue placeholder="Choose sort order" />
                    </SelectTrigger>
                    <SelectContent
                      align="end"
                      position="popper"
                      sideOffset={6}
                      className="z-[200] max-h-[min(22rem,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] rounded-xl border border-border bg-card p-1.5 text-foreground shadow-lg"
                    >
                      <SelectItem value="popularity" className="cursor-pointer rounded-lg py-2.5 pl-9 pr-3 text-sm font-medium data-[highlighted]:bg-muted">
                        Best match
                      </SelectItem>
                      <SelectItem value="price-asc" className="cursor-pointer rounded-lg py-2.5 pl-9 pr-3 text-sm data-[highlighted]:bg-muted">
                        Price: low to high
                      </SelectItem>
                      <SelectItem value="price-desc" className="cursor-pointer rounded-lg py-2.5 pl-9 pr-3 text-sm data-[highlighted]:bg-muted">
                        Price: high to low
                      </SelectItem>
                      <SelectItem value="mileage" className="cursor-pointer rounded-lg py-2.5 pl-9 pr-3 text-sm data-[highlighted]:bg-muted">
                        Mileage (best first)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="skeleton-shimmer flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm"
                    >
                      <div className="aspect-16/10 bg-muted sm:aspect-5/3" />
                      <div className="space-y-2.5 border-b border-border p-4">
                        <div className="h-5 w-2/3 rounded-md bg-muted" />
                        <div className="h-4 w-full rounded-md bg-muted" />
                        <div className="h-16 rounded-lg bg-muted" />
                      </div>
                      <div className="h-12 border-t border-border bg-muted/20" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                    {filtered.slice(0, visibleCount).map((row) => (
                      <AiMatchedCarCard
                        key={row.id}
                        row={row}
                        onNavigate={() =>
                          trackEvent("ai_matched_car_card_click", {
                            event_category: GA_CATEGORIES.home,
                            model_id: row.id,
                            path: row.href ?? "",
                          })
                        }
                      />
                    ))}
                  </div>
                  {visibleCount < filtered.length ? (
                    <div className="mt-8 text-center">
                      <Button
                        variant="listing"
                        className="px-6"
                        onClick={() => {
                          setVisibleCount((c) => c + 6);
                          trackEvent("load_more_click", {
                            event_category: GA_CATEGORIES.home,
                            current_count: visibleCount,
                          });
                        }}
                      >
                        Load more cars
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <DiscoveryCatalogueTrending />

      <HomeBrowseMarketplace />

      <section className="relative z-[1] mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
        {!loading ? <HomeExpertBookCta className="mt-2" /> : null}
      </section>

      <HomeIdgFullVideoBand />

      <HomePlatformHighlights />
    </div>
  );
}
