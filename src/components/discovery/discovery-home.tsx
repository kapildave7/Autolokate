"use client";

import { useMemo, useState } from "react";
import { BanknoteIcon, Car, Flame, MapPin, Pencil, Sparkles, Tag, Users } from "lucide-react";
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
import { HomeBrowseMarketplace } from "@/components/home/home-browse-marketplace";
import { HomePlatformHighlights } from "@/components/home/home-platform-highlights";

type SortBy = "price-asc" | "price-desc" | "mileage" | "popularity";

const STEP_META: Record<string, { label: string; Icon: React.ElementType }> = {
  city:         { label: "City",      Icon: MapPin },
  budget:       { label: "Budget",    Icon: BanknoteIcon },
  body:         { label: "Body type", Icon: Car },
  body_type:    { label: "Body type", Icon: Car },
  fuel:         { label: "Fuel",      Icon: Flame },
  fuel_type:    { label: "Fuel",      Icon: Flame },
  seating:      { label: "Seats",     Icon: Users },
  use_case:     { label: "Usage",     Icon: Users },
  usage:        { label: "Usage",     Icon: Users },
  priority:     { label: "Priority",  Icon: Sparkles },
  features:     { label: "Features",  Icon: Sparkles },
};

export function DiscoveryHome() {
  const reduceMotion = useReducedMotion();
  const [sort, setSort] = useState<SortBy>("popularity");
  const [visibleCount, setVisibleCount] = useState(6);
  const promptSnapshot = usePreferenceFinderStore((s) => s.promptSnapshot);
  const answerHistory = usePreferenceFinderStore((s) => s.answerHistory);
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
      <HomeHeroSection reduceMotion={reduceMotion} />

      {/* Preference finder (wizard) — hidden from home for now; restore block + HomeHeroPreferenceWizard import when bringing it back.
      <section
        aria-label="Preference finder"
        className="relative z-[1] border-b border-border/70 bg-hero-mesh py-12 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-2xl space-y-3">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-primary/15 bg-primary/5 shadow-sm">
                <ListChecks className="h-3.5 w-3.5" aria-hidden />
              </span>
              Preference finder
            </p>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Shape a comparable shortlist in minutes
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Answer four quick steps — city, body, fuel & budget — and we wire your picks straight to live
              listings. Sign in to save the session and resume anytime.
            </p>
          </div>
          <div className="mx-auto w-full max-w-xl">
            <HomeHeroPreferenceWizard
              reduceMotion={reduceMotion}
              allCities={allCities}
              recommendationLine={recommendationLine}
              onViewMatches={scrollToMatches}
            />
          </div>
        </div>
      </section>
      */}

      {hasMatches ? (
        <section className="relative z-[1] mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-8 lg:px-8">
          <div
            id="ai-matched-results"
            className="scroll-mt-20 sm:scroll-mt-24"
            aria-label="Matched car results"
          >
            <div className="relative overflow-hidden rounded-[1.35rem] border border-border/80 bg-card p-6 shadow-premium ring-1 ring-foreground/[0.04] sm:p-8 lg:p-10">
              <div
                className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-blue-500/[0.06] blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-zinc-400/[0.05] blur-3xl"
                aria-hidden
              />

              <div className="relative">
                {/* Header row */}
                <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
                  <div className="min-w-0 space-y-2">
                    {/* Live matches pill */}
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5 text-blue-500" aria-hidden />
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

                    {/* Heading */}
                    <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      Your{" "}
                      <span className="text-primary">matched</span>{" "}
                      cars
                    </h2>
                    <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                      {promptSnapshot.city || promptSnapshot.budget
                        ? "Results based on your questionnaire answers."
                        : recommendationLine}
                    </p>
                    {resultsMeta.aiSummary ? (
                      <p className="max-w-2xl border-l-2 border-blue-500/40 pl-4 text-sm leading-relaxed text-foreground sm:text-[0.9375rem]">
                        {resultsMeta.aiSummary}
                      </p>
                    ) : null}
                  </div>

                  {/* Sort */}
                  <div className="flex w-full shrink-0 flex-col gap-2 lg:w-[min(100%,240px)]">
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
                          "h-10 w-full cursor-pointer rounded-xl border border-border bg-background px-3.5 text-left text-sm font-medium text-foreground shadow-sm",
                          "transition-colors hover:border-border hover:bg-muted/30",
                          "focus:ring-2 focus:ring-blue-400/30 focus:ring-offset-0",
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

                {/* Filter chips — one per answered step */}
                {answerHistory.length > 0 ? (
                  <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-border pb-6">
                    {answerHistory.map((a) => {
                      const meta = STEP_META[a.step_id] ?? { label: a.step_id, Icon: Tag };
                      const { label, Icon } = meta;
                      const value = (a.display_labels ?? []).join(", ") || (a.selected_option_ids ?? []).join(", ");
                      if (!value) return null;
                      return (
                        <span
                          key={a.step_id}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
                            "border-border/80 bg-card text-foreground shadow-sm",
                            "dark:border-zinc-700/80 dark:bg-zinc-800/60 dark:text-zinc-200"
                          )}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                          {label}: {value}
                        </span>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        trackEvent("edit_preferences_click", { event_category: GA_CATEGORIES.home });
                        document.getElementById("preference-finder-stepper")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="inline-flex items-center gap-1.5 px-1 py-1.5 text-xs font-semibold text-primary transition hover:text-primary/75"
                    >
                      <Pencil className="h-3 w-3" aria-hidden />
                      Edit preferences
                    </button>
                  </div>
                ) : null}

                {/* Cards */}
                {loading ? (
                  <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="skeleton-shimmer flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                      >
                        {/* Full-width image */}
                        <div className="aspect-[16/9] w-full bg-muted" />
                        {/* Two-column body */}
                        <div className="flex gap-4 px-4 py-4">
                          <div className="flex-1 space-y-2">
                            <div className="h-5 w-3/4 rounded-md bg-muted" />
                            <div className="h-3.5 w-1/2 rounded bg-muted" />
                            <div className="mt-3 h-3 w-1/4 rounded bg-muted" />
                            <div className="h-4 w-2/3 rounded-md bg-muted" />
                          </div>
                          <div className="w-[45%] space-y-2.5">
                            <div className="h-3 w-full rounded bg-muted" />
                            <div className="h-3 w-full rounded bg-muted" />
                            <div className="h-3 w-4/5 rounded bg-muted" />
                            <div className="h-3 w-full rounded bg-muted" />
                          </div>
                        </div>
                        <div className="mt-auto h-10 border-t border-border bg-muted/20" />
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
                          variant="outline"
                          className="rounded-xl border-border bg-card px-8 text-sm font-semibold text-foreground hover:bg-muted/50 hover:border-border/80"
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

      <HomeBrowseMarketplace />

      <section className="relative z-[1] mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
        {!loading ? <HomeExpertBookCta className="mt-2" /> : null}
      </section>

      <HomeIdgFullVideoBand />

      <HomePlatformHighlights />
    </div>
  );
}
