"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { GitCompare, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { compareVariantsList, getTrending } from "@/lib/client/catalogue-api";
import { getTaxonomy } from "@/lib/client/taxonomy-api";
import { buildTaxonomyLabelMaps } from "@/lib/taxonomy-labels";
import { comparePathForIds } from "@/lib/seo/paths";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCompareStore } from "@/stores/compare-store";
import { PageFade } from "@/components/shared/page-fade";
import { ExpertConsultationSection } from "@/components/shared/expert-consultation-section";
import { Badge } from "@/components/ui/badge";
import { GA_CATEGORIES, trackEvent } from "@/lib/analytics";
import { CompareCatalogueMatrix } from "@/components/compare/compare-catalogue-matrix";
import { CatalogueVariantSearch } from "@/components/compare/catalogue-variant-search";
import { RemoteImageWithFallback } from "@/components/ui/remote-image";
import { formatINR } from "@/lib/utils";
import { resolveCatalogueModelToVariantId } from "@/lib/compare-listing-resolve";

type SuggestedVariant = {
  variantId: string;
  brand: string;
  model: string;
  image: string;
  price: number | null;
};

function parseIdsParam(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => decodeURIComponent(s.trim()))
    .filter(Boolean)
    .slice(0, 3);
}

function comparePairHref(ids: string[]): string {
  const q = ids.map((id) => encodeURIComponent(id)).join(",");
  return q ? `/compare?ids=${q}` : "/compare";
}

export function CompareView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const variantIds = useCompareStore((s) => s.variantIds);
  const setVariantIds = useCompareStore((s) => s.setVariantIds);
  const addVariant = useCompareStore((s) => s.addVariant);
  const removeVariant = useCompareStore((s) => s.removeVariant);
  const clear = useCompareStore((s) => s.clear);

  const idsFromUrl = searchParams.get("ids");

  useEffect(() => {
    const fromUrl = parseIdsParam(idsFromUrl);
    if (fromUrl.length > 0) {
      setVariantIds(fromUrl);
    }
  }, [idsFromUrl, setVariantIds]);

  useEffect(() => {
    const q = variantIds.map((id) => encodeURIComponent(id)).join(",");
    const next = q ? `/compare?ids=${q}` : "/compare";
    router.replace(next, { scroll: false });
  }, [variantIds, router]);

  const { data: suggested = [] } = useQuery({
    queryKey: ["compare-suggested-variants"],
    queryFn: async () => {
      const models = (await getTrending()).slice(0, 12);
      const out: SuggestedVariant[] = [];

      for (const row of models) {
        if (out.length >= 8) break;
        const variantId = await resolveCatalogueModelToVariantId(row);
        if (!variantId || out.some((x) => x.variantId === variantId)) continue;

        const rec = row as Record<string, unknown>;
        out.push({
          variantId,
          brand: String(rec.brand_name ?? "").trim(),
          model: String(rec.model_name ?? rec.name ?? "").trim(),
          image: String(rec.hero_image_url ?? rec.image_url ?? rec.thumbnail_url ?? "").trim(),
          price: typeof rec.min_price === "number" && rec.min_price > 0 ? rec.min_price : null,
        });
      }
      return out;
    },
    staleTime: 120_000,
  });

  useEffect(() => {
    const idsFromQuery = parseIdsParam(idsFromUrl);
    if (idsFromQuery.length > 0 || variantIds.length > 0 || suggested.length < 2) return;
    setVariantIds(suggested.slice(0, 2).map((s) => s.variantId));
  }, [idsFromUrl, setVariantIds, suggested, variantIds.length]);

  const suggestedPairs = useMemo(() => {
    const pairs: [SuggestedVariant, SuggestedVariant][] = [];
    for (let i = 0; i + 1 < suggested.length && pairs.length < 4; i += 2) {
      pairs.push([suggested[i]!, suggested[i + 1]!]);
    }
    return pairs;
  }, [suggested]);

  const { data: taxonomy } = useQuery({
    queryKey: ["taxonomy", "car"],
    queryFn: () => getTaxonomy({ category: "car" }),
    staleTime: 86_400_000,
  });

  const labelMaps = useMemo(
    () => (taxonomy ? buildTaxonomyLabelMaps(taxonomy.specs, taxonomy.features) : null),
    [taxonomy]
  );

  const { data: variants = [], isPending, isError, error } = useQuery({
    queryKey: ["catalogue-compare-page", variantIds.join("|")],
    queryFn: () => compareVariantsList(variantIds),
    enabled: variantIds.length >= 2,
    staleTime: 120_000,
  });

  const handleAddFromSearch = useCallback(
    (variantId: string, label: string) => {
      const ok = addVariant(variantId);
      if (!ok) {
        toast.message("Compare is full (max 3). Remove a variant to add another.");
        trackEvent("compare_tray_full", { event_category: GA_CATEGORIES.compare });
        return;
      }
      toast.success("Added to compare.");
      trackEvent("compare_add_from_search", {
        event_category: GA_CATEGORIES.compare,
        variant_id: variantId,
        label,
      });
    },
    [addVariant]
  );

  const compareHref = comparePathForIds(variantIds);

  const slots = [0, 1, 2] as const;
  const loadedById = useMemo(() => {
    const m = new Map<string, Record<string, unknown>>();
    for (const v of variants) {
      const id = typeof v.id === "string" ? v.id : null;
      if (id) m.set(id, v);
    }
    return m;
  }, [variants]);

  return (
    <PageFade>
      <section className="relative overflow-hidden border-b border-border bg-linear-to-b from-secondary/60 via-background to-background">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -left-16 top-8 h-44 w-44 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-primary/8 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <Badge variant="secondary" className="gap-1 border-border bg-muted text-foreground">
                <GitCompare className="h-3.5 w-3.5 text-[#14532d] dark:text-[#166534]" />
                Compare
              </Badge>
              <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl lg:text-[2.4rem] lg:leading-tight">
                Compare variants side by side
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                Focused compare workspace: pick up to three variants, then review only meaningful differences.
              </p>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Tray: {variantIds.length}/3 selected
              </div>
            </div>
            <div className="flex w-full gap-2 sm:w-auto sm:justify-end">
              <Button
                variant="outline"
                className="h-10 min-h-10 flex-1 rounded-full border-border sm:flex-initial"
                onClick={() => {
                  trackEvent("compare_clear_tray", {
                    event_category: GA_CATEGORIES.compare,
                    had_count: variantIds.length,
                  });
                  clear();
                }}
                disabled={variantIds.length === 0}
              >
                Clear tray
              </Button>
              <Button
                variant="default"
                className="h-10 min-h-10 flex-1 rounded-full bg-[#14532d] hover:bg-[#14532d]/90 dark:bg-[#166534] dark:hover:bg-[#166534]/90 sm:flex-initial"
                disabled={variantIds.length < 2}
                asChild
              >
                <Link
                  href={compareHref}
                  onClick={() =>
                    trackEvent("compare_now", {
                      event_category: GA_CATEGORIES.compare,
                      variant_count: variantIds.length,
                    })
                  }
                >
                  Compare now
                </Link>
              </Button>
            </div>
          </div>

          {suggestedPairs.length > 0 ? (
            <div className="mt-7 rounded-2xl border border-border bg-card/80 p-3.5 shadow-sm ring-1 ring-foreground/5 sm:p-4">
              <div className="mb-3 flex items-end justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Suggested pairs</p>
                  <p className="mt-1 text-xs text-muted-foreground">Tap any pair to start a quick 2-variant comparison.</p>
                </div>
                <Badge variant="secondary" className="h-6 rounded-full px-2.5 text-[10px]">
                  Quick start
                </Badge>
              </div>
              <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
                <div className="flex w-max snap-x snap-mandatory gap-3 pb-1 sm:gap-4">
                  {suggestedPairs.map(([a, b]) => {
                    const ids = [a.variantId, b.variantId];
                    return (
                      <div
                        key={`${a.variantId}-${b.variantId}`}
                        className="group flex w-[min(88vw,372px)] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm ring-1 ring-foreground/4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:w-[352px]"
                      >
                        <div className="grid grid-cols-[1fr_auto_1fr] items-stretch bg-linear-to-b from-muted/20 to-card">
                          <div className="p-3 sm:p-3.5">
                            <div className="relative mx-auto aspect-5/3 w-full max-w-[132px] overflow-hidden rounded-xl border border-border/70 bg-muted">
                              {a.image ? (
                                <RemoteImageWithFallback src={a.image} alt="" fill className="object-cover" sizes="132px" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">—</div>
                              )}
                            </div>
                            <p className="mt-2 line-clamp-1 text-xs font-semibold text-foreground">{a.brand || "Brand"}</p>
                            <p className="line-clamp-1 text-xs text-muted-foreground">{a.model || "Model"}</p>
                            <p className="mt-1 text-xs font-bold text-foreground">{a.price != null ? formatINR(a.price) : "—"}</p>
                          </div>
                          <div className="flex items-center justify-center border-x border-border px-1">
                            <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-black tracking-wide text-muted-foreground shadow-sm">
                              VS
                            </span>
                          </div>
                          <div className="p-3 sm:p-3.5">
                            <div className="relative mx-auto aspect-5/3 w-full max-w-[132px] overflow-hidden rounded-xl border border-border/70 bg-muted">
                              {b.image ? (
                                <RemoteImageWithFallback src={b.image} alt="" fill className="object-cover" sizes="132px" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">—</div>
                              )}
                            </div>
                            <p className="mt-2 line-clamp-1 text-xs font-semibold text-foreground">{b.brand || "Brand"}</p>
                            <p className="line-clamp-1 text-xs text-muted-foreground">{b.model || "Model"}</p>
                            <p className="mt-1 text-xs font-bold text-foreground">{b.price != null ? formatINR(b.price) : "—"}</p>
                          </div>
                        </div>
                        <div className="border-t border-border bg-muted/30 p-2.5">
                          <Button
                            size="sm"
                            variant="listing"
                            className="h-8 w-full rounded-full border border-primary/25 bg-background text-primary shadow-sm hover:bg-primary/5"
                            asChild
                          >
                            <Link
                              href={comparePairHref(ids)}
                              onClick={() => {
                                setVariantIds(ids);
                                trackEvent("compare_suggested_pair_click", {
                                  event_category: GA_CATEGORIES.compare,
                                  variant_count: 2,
                                });
                              }}
                            >
                              Compare now
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {slots.map((i) => {
              const id = variantIds[i];
              const row = id ? loadedById.get(id) : undefined;
              const slotTone = "from-muted/35 to-card";
              return (
                <div
                  key={i}
                  className={`flex min-h-28 items-center gap-3 rounded-2xl border p-3.5 transition sm:p-4 ${
                    id
                      ? `border-border bg-linear-to-b ${slotTone} shadow-sm ring-1 ring-foreground/5`
                      : "border-dashed border-border bg-muted/20"
                  }`}
                >
                  {id && row ? (
                    <>
                      <div className="relative h-14 w-22 shrink-0 overflow-hidden rounded-xl bg-muted/50 sm:h-15 sm:w-24">
                        {typeof row.image_url === "string" && row.image_url ? (
                          <RemoteImageWithFallback src={row.image_url} alt="" fill className="object-cover" sizes="96px" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">—</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {[row.brand_name, row.model_name].filter(Boolean).join(" ") || "Variant"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{String(row.variant_name ?? row.name ?? "")}</p>
                        <p className="text-xs font-semibold text-foreground">
                          {(() => {
                            const p = row.ex_showroom_price ?? row.min_price;
                            return typeof p === "number" && p > 0 ? formatINR(p) : "—";
                          })()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          trackEvent("compare_remove_car", {
                            event_category: GA_CATEGORIES.compare,
                            source: "compare_slot",
                            variant_id: id,
                          });
                          removeVariant(id);
                        }}
                        className="shrink-0 rounded-xl border border-border bg-secondary/60 p-2 text-muted-foreground transition hover:border-border hover:bg-muted hover:text-foreground"
                        aria-label="Remove from compare"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : id ? (
                    <div className="flex w-full items-center gap-3">
                      <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
                      <div className="min-w-0 text-left">
                        <p className="text-sm font-semibold text-foreground">Loading variant…</p>
                        <p className="truncate text-xs text-muted-foreground">{id}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex w-full items-center gap-3 text-left">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/40 text-primary">
                        <GitCompare className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Slot {i + 1}</p>
                        <p className="text-xs text-muted-foreground">Search and add a variant</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid gap-8 xl:grid-cols-12 xl:items-stretch xl:gap-10">
          <div className="flex min-h-0 flex-col gap-6 xl:col-span-5 xl:h-full">
            <div className="shrink-0 space-y-5 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <div>
                <h2 className="text-lg font-bold text-foreground sm:text-xl">Add variants</h2>
                <p className="mt-1 text-sm text-muted-foreground">Search the catalogue — up to three at a time.</p>
              </div>
              <CatalogueVariantSearch
                excludeVariantIds={variantIds}
                disabled={variantIds.length >= 3}
                onAddVariant={handleAddFromSearch}
                analyticsContext="compare_page"
              />
            </div>
            <div className="w-full shrink-0 xl:sticky xl:top-24 xl:z-10">
              <ExpertConsultationSection placement="compare" trackSource="compare_page_catalog" />
            </div>
          </div>

          <div className="min-w-0 xl:col-span-7 xl:min-h-0">
            {variantIds.length === 0 ? (
              <Card className="border-dashed border-border bg-muted/20 shadow-sm">
                <CardContent className="flex flex-col items-center py-12 text-center sm:py-14">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Empty tray</p>
                  <p className="mt-3 max-w-md text-lg font-semibold text-foreground sm:text-xl">Nothing to compare yet</p>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Start from suggested pairs above or search variants from the left panel.
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {variantIds.length === 1 ? (
              <Card className="border-border bg-card shadow-sm">
                <CardContent className="py-10 text-center">
                  <p className="text-base font-semibold text-foreground">One more to go</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add at least one more variant to load the side-by-side spec matrix.
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {variantIds.length >= 2 && isPending ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-16 text-muted-foreground shadow-sm">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading comparison…
              </div>
            ) : null}

            {variantIds.length >= 2 && isError ? (
              <div className="rounded-2xl border border-border bg-muted/40 p-6 text-sm text-foreground shadow-sm">
                Could not load this comparison.{error instanceof Error ? ` ${error.message}` : ""}
              </div>
            ) : null}

            {variantIds.length >= 2 && !isPending && !isError && variants.length < 2 ? (
              <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
                The API returned fewer than two variants. Confirm the IDs are valid catalogue variant IDs.
              </div>
            ) : null}

            {variants.length >= 2 && !isPending && !isError ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Side by side</p>
                  <h2 className="font-display mt-2 text-xl tracking-tight text-foreground sm:text-2xl">Spec matrix</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Differences across columns are tinted. Data source: catalogue compare API.
                  </p>
                </div>
                <CompareCatalogueMatrix variants={variants} labelMaps={labelMaps} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </PageFade>
  );
}
