"use client";

import { useQuery } from "@tanstack/react-query";
import { Flame, Sparkles } from "lucide-react";
import { getTrending } from "@/lib/client/catalogue-api";
import { TrendingModelsRail, type TrendingCatalogueItem } from "@/components/home/trending-models-rail";
import { formatINR } from "@/lib/utils";

function toTrendingItems(rows: Record<string, unknown>[]): TrendingCatalogueItem[] {
  return rows.map((row, i) => {
    const slug = String(row.slug ?? "").trim();
    const brand = String(row.brand_name ?? "").trim();
    const model = String(row.model_name ?? row.name ?? "").trim();
    const id = String(row.id ?? slug ?? `trend-${i}`);
    const min = row.min_price ?? row.starting_price ?? row.max_price;
    const max = row.max_price;
    const minN = typeof min === "number" ? min : Number(min);
    const maxN = typeof max === "number" ? max : Number(max);
    let priceLabel = "Price on request";
    if (Number.isFinite(minN) && minN > 0) {
      if (Number.isFinite(maxN) && maxN > minN) {
        priceLabel = `${formatINR(minN)} – ${formatINR(maxN)}`;
      } else {
        priceLabel = `From ${formatINR(minN)}`;
      }
    }
    const hero = String(row.hero_image_url ?? row.image_url ?? row.thumbnail_url ?? "").trim();
    const fuel = row.fuel_type ?? (Array.isArray(row.fuel_types) ? (row.fuel_types as string[])[0] : "");
    const body = row.body_type;
    const subtitle = [body, fuel].filter(Boolean).join(" · ") || "Catalogue model";
    return {
      id,
      href: slug ? `/cars/${encodeURIComponent(slug)}` : "/cars",
      title: [brand, model].filter(Boolean).join(" ") || model || "Model",
      subtitle,
      imageUrl: hero || null,
      imageAlt: `${brand} ${model}`.trim() || model,
      priceLabel,
    };
  });
}

export function DiscoveryCatalogueTrending() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["catalogue-trending"],
    queryFn: () => getTrending(),
    staleTime: 5 * 60_000,
  });

  if (isError) return null;
  const items = data?.length ? toTrendingItems(data) : [];

  if (!isPending && items.length === 0) return null;

  return (
    <section className="relative border-b border-border bg-hero-mesh py-11 sm:py-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-border to-transparent" aria-hidden />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div className="max-w-2xl space-y-2.5">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-primary/15 bg-primary/5 shadow-sm">
                <Flame className="h-3.5 w-3.5" aria-hidden />
              </span>
              Trending in catalogue
            </p>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Models buyers are exploring
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Live picks from the catalogue — open a model for variants, specs, and pricing.
            </p>
          </div>
          {!isPending ? (
            <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-border/80 bg-card/90 px-4 py-2.5 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden />
              <span className="tabular-nums">{items.length}</span>
              <span className="text-muted-foreground">models · swipe on mobile</span>
            </div>
          ) : null}
        </div>

        {isPending ? (
          <div className="min-w-0 overflow-hidden">
            <div className="flex gap-3 pb-2 sm:gap-4">
              {[0, 1, 2, 3, 4].map((k) => (
                <div
                  key={k}
                  className="h-[15.5rem] w-[10.75rem] shrink-0 animate-pulse rounded-2xl border border-border bg-muted/80 sm:h-[16.25rem] sm:w-[11.75rem]"
                />
              ))}
            </div>
          </div>
        ) : (
          <TrendingModelsRail items={items} />
        )}
      </div>
    </section>
  );
}
