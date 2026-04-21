"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, GitCompare, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { compareVariantsList } from "@/lib/client/catalogue-api";
import { getTaxonomy } from "@/lib/client/taxonomy-api";
import {
  buildTaxonomyLabelMaps,
  labelForCompareRowKey,
  orderedCompareAttributeKeys,
} from "@/lib/taxonomy-labels";
import { catalogueComparePath, comparePathForIds } from "@/lib/seo/paths";
import { cn, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageFade } from "@/components/shared/page-fade";
import { Badge } from "@/components/ui/badge";
import { GA_CATEGORIES, trackEvent } from "@/lib/analytics";
import { useCompareStore } from "@/stores/compare-store";
import { CatalogueVariantSearch } from "@/components/compare/catalogue-variant-search";
import { RemoteImageWithFallback } from "@/components/ui/remote-image";

function parseIdsParam(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => decodeURIComponent(s.trim()))
    .filter(Boolean)
    .slice(0, 3);
}

function formatCell(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    const looksLikePrice =
      /price|ex_showroom|on.?road|emi/i.test(key) || key === "min_price" || key === "max_price";
    if (looksLikePrice && value >= 1000) return formatINR(value);
    return String(value);
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value.trim() || "—";
  if (Array.isArray(value)) return value.map((v) => String(v)).join(", ") || "—";
  return "—";
}

const BLOCKED_KEYS = new Set([
  "id",
  "brand",
  "created_at",
  "updated_at",
  "hero_image_url",
  "image_url",
  "thumbnail_url",
]);

export function CatalogueCompareView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const variantIds = useCompareStore((s) => s.variantIds);
  const setVariantIds = useCompareStore((s) => s.setVariantIds);
  const addVariant = useCompareStore((s) => s.addVariant);
  const removeVariant = useCompareStore((s) => s.removeVariant);

  const [urlSynced, setUrlSynced] = useState(false);
  const idsFromUrl = searchParams.get("ids");

  useEffect(() => {
    const fromUrl = parseIdsParam(idsFromUrl);
    if (fromUrl.length > 0) {
      setVariantIds(fromUrl);
    }
    setUrlSynced(true);
  }, [idsFromUrl, setVariantIds]);

  useEffect(() => {
    if (!urlSynced) return;
    const q = variantIds.map((id) => encodeURIComponent(id)).join(",");
    const next = q ? `/compare/catalogue?ids=${q}` : "/compare/catalogue";
    router.replace(next, { scroll: false });
  }, [variantIds, router, urlSynced]);

  const handleAddFromSearch = useCallback(
    (variantId: string, _label: string) => {
      void _label;
      const ok = addVariant(variantId);
      if (!ok) {
        toast.message("Compare is full (max 3). Remove a variant to add another.");
        trackEvent("compare_tray_full", { event_category: GA_CATEGORIES.compare });
      } else {
        toast.success("Added to compare.");
      }
    },
    [addVariant]
  );

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
    queryKey: ["catalogue-compare", variantIds.join("|")],
    queryFn: () => compareVariantsList(variantIds),
    enabled: variantIds.length >= 1,
    staleTime: 120_000,
  });

  const rows = useMemo(() => {
    if (variants.length < 2) return [];
    const keys = new Set<string>();
    for (const v of variants) {
      Object.keys(v).forEach((k) => {
        if (!BLOCKED_KEYS.has(k)) keys.add(k);
      });
    }
    const ordered = orderedCompareAttributeKeys(keys, BLOCKED_KEYS, labelMaps);
    return ordered.map((key) => ({
      key,
      label: labelForCompareRowKey(key, labelMaps),
      values: variants.map((v) => formatCell(key, v[key])),
    }));
  }, [variants, labelMaps]);

  const loadedById = useMemo(() => {
    const m = new Map<string, Record<string, unknown>>();
    for (const v of variants) {
      const id = typeof v.id === "string" ? v.id : null;
      if (id) m.set(id, v);
    }
    return m;
  }, [variants]);

  const title = variants.length
    ? variants.map((v) => String(v.variant_name ?? v.name ?? "Variant")).join(" vs ")
    : "Compare catalogue variants";

  const slots = [0, 1, 2] as const;

  return (
    <PageFade>
      <section className="border-b border-border bg-gradient-to-b from-secondary/60 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl space-y-3">
              <Button variant="ghost" size="sm" className="-ml-2 w-fit gap-1 text-muted-foreground" asChild>
                <Link
                  href="/compare"
                  onClick={() =>
                    trackEvent("catalogue_compare_to_main", { event_category: GA_CATEGORIES.compare })
                  }
                >
                  <ArrowLeft className="h-4 w-4" />
                  Full compare workspace
                </Link>
              </Button>
              <Badge variant="secondary" className="gap-1 border-primary/15 bg-primary/8 text-primary">
                <GitCompare className="h-3.5 w-3.5" />
                Catalogue table
              </Badge>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Same <strong className="font-medium text-foreground">variant tray</strong> as{" "}
                <Link href="/compare" className="font-medium text-primary underline-offset-4 hover:underline">
                  /compare
                </Link>
                — add rows from search, listing cards, or model pages. This page is the compact spec table; inventory
                context stays on the main compare view.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {slots.map((i) => {
              const id = variantIds[i];
              const row = id ? loadedById.get(id) : undefined;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex min-h-[6.5rem] items-center gap-3 rounded-2xl border p-3 transition sm:min-h-[7rem] sm:p-4",
                    id
                      ? "border-border bg-card shadow-sm ring-1 ring-foreground/[0.04]"
                      : "border-dashed border-border bg-muted/15"
                  )}
                >
                  {id && row ? (
                    <>
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-muted/50 sm:h-16 sm:w-24">
                        {typeof row.image_url === "string" && row.image_url ? (
                          <RemoteImageWithFallback src={row.image_url} alt="" fill className="object-cover" sizes="96px" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">—</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-foreground sm:text-sm">
                          {[row.brand_name, row.model_name].filter(Boolean).join(" ") || "Variant"}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
                          {String(row.variant_name ?? row.name ?? "")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          trackEvent("compare_remove_car", {
                            event_category: GA_CATEGORIES.compare,
                            source: "catalogue_slot",
                            variant_id: id,
                          });
                          removeVariant(id);
                        }}
                        className="shrink-0 rounded-xl border border-border bg-secondary/50 p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
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
                        <p className="truncate text-xs text-muted-foreground">{id.slice(0, 12)}…</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex w-full items-center gap-2 text-left sm:gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/40 text-[#14532d] dark:text-[#166534]">
                        <GitCompare className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-foreground sm:text-sm">Slot {i + 1}</p>
                        <p className="text-[11px] text-muted-foreground sm:text-xs">Search below</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <h2 className="text-base font-bold text-foreground">Add catalogue variants</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Search by brand, model, or trim. Listings you add via “Compare” on cards resolve here when matched to a
              catalogue variant.
            </p>
            <div className="mt-4">
              <CatalogueVariantSearch
                excludeVariantIds={variantIds}
                disabled={variantIds.length >= 3}
                onAddVariant={handleAddFromSearch}
                analyticsContext="catalogue_compare_page"
              />
            </div>
            {variantIds.length > 0 && variantIds.length < 2 ? (
              <p className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                Add <strong className="text-foreground">one more</strong> variant to load the table — or open{" "}
                <Link href={comparePathForIds(variantIds)} className="font-medium text-primary underline-offset-4 hover:underline">
                  the full compare workspace
                </Link>{" "}
                for the same tray with a richer matrix.
              </p>
            ) : null}
          </div>

          <div className="min-w-0 lg:col-span-7">
            {variantIds.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center sm:p-10">
                <p className="text-sm font-medium text-foreground">Nothing in your compare tray yet</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add variants from search, or use <strong className="text-foreground">Compare</strong> on any listing or
                  matched car card — your tray syncs to this URL automatically.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button variant="cta" asChild>
                    <Link href="/cars/explore">Browse listings</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/compare">Open /compare</Link>
                  </Button>
                </div>
              </div>
            ) : null}

            {variantIds.length >= 2 && isPending ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading comparison…
              </div>
            ) : null}

            {variantIds.length >= 2 && isError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-900">
                Could not load this comparison.{error instanceof Error ? ` ${error.message}` : ""}
              </div>
            ) : null}

            {variantIds.length >= 2 && !isPending && !isError && variants.length < 2 ? (
              <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
                The API returned fewer than two variants. Confirm the IDs are valid catalogue variant IDs.
              </div>
            ) : null}

            {variants.length >= 2 && rows.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
                <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="sticky left-0 z-[1] bg-muted/50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        Detail
                      </th>
                      {variants.map((v, i) => (
                        <th key={String(v.id ?? i)} className="min-w-[10rem] px-4 py-3 align-bottom">
                          <p className="font-display text-sm font-semibold text-foreground">
                            {String(v.variant_name ?? v.name ?? `Variant ${i + 1}`)}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {[v.brand_name, v.model_name].filter(Boolean).join(" ")}
                          </p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={row.key} className={cn(idx % 2 === 0 ? "bg-card" : "bg-muted/30")}>
                        <th
                          scope="row"
                          className="sticky left-0 z-[1] border-t border-border bg-inherit px-4 py-2.5 text-xs font-semibold text-muted-foreground"
                        >
                          {row.label}
                        </th>
                        {row.values.map((cell, ci) => (
                          <td key={ci} className="border-t border-border px-4 py-2.5 text-foreground">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {variants.length >= 2 ? (
              <p className="mt-6 text-center text-xs text-muted-foreground">
                Share this table:{" "}
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => {
                    const url = `${window.location.origin}${catalogueComparePath(variantIds)}`;
                    void navigator.clipboard.writeText(url);
                    trackEvent("catalogue_compare_copy_link", {
                      event_category: GA_CATEGORIES.compare,
                      variant_count: variantIds.length,
                    });
                  }}
                >
                  Copy link
                </button>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </PageFade>
  );
}
