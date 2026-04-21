"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Search } from "lucide-react";
import { searchCatalogue } from "@/lib/client/catalogue-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { GA_CATEGORIES, trackEvent } from "@/lib/analytics";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

type Props = {
  excludeVariantIds: string[];
  disabled: boolean;
  onAddVariant: (variantId: string, label: string) => void;
  analyticsContext?: string;
};

export function CatalogueVariantSearch({ excludeVariantIds, disabled, onAddVariant, analyticsContext }: Props) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q.trim()), 320);
    return () => window.clearTimeout(t);
  }, [q]);

  const { data: raw = [], isFetching } = useQuery({
    queryKey: ["catalogue-search-compare", debounced],
    queryFn: () => searchCatalogue(debounced),
    enabled: debounced.length >= 2 && !disabled,
    staleTime: 60_000,
  });

  const variants = useMemo(() => {
    const ex = new Set(excludeVariantIds);
    return raw.filter((row) => {
      if (!isRecord(row)) return false;
      const id = row.id;
      const name = row.variant_name ?? row.name;
      if (typeof id !== "string" || id.length < 8) return false;
      if (!name || String(name).length < 2) return false;
      if (ex.has(id)) return false;
      return true;
    }) as Record<string, unknown>[];
  }, [raw, excludeVariantIds]);

  const add = useCallback(
    (row: Record<string, unknown>) => {
      const id = String(row.id);
      const label = String(row.variant_name ?? row.name ?? "Variant");
      onAddVariant(id, label);
      trackEvent("compare_search_add_variant", {
        event_category: GA_CATEGORIES.compare,
        context: analyticsContext ?? "compare_page",
      });
      setQ("");
    },
    [onAddVariant, analyticsContext]
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search brand, model, or variant…"
          disabled={disabled}
          className="h-11 rounded-xl border-border bg-background pl-10 pr-3 text-sm"
          aria-label="Search catalogue variants to compare"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Results are new-car catalogue variants (ex-showroom). Used listings are matched when possible via search.
      </p>
      <div
        className={cn(
          "max-h-[min(22rem,50vh)] space-y-2 overflow-y-auto rounded-xl border border-border bg-card p-2",
          disabled && "pointer-events-none opacity-60"
        )}
      >
        {debounced.length < 2 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">Type at least two characters to search.</p>
        ) : isFetching ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching…
          </div>
        ) : variants.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">No variants found. Try another keyword.</p>
        ) : (
          variants.map((row) => {
            const id = String(row.id);
            const title = String(row.variant_name ?? row.name ?? "Variant");
            const brand = String(row.brand_name ?? "");
            const model = String(row.model_name ?? "");
            const sub = [brand, model].filter(Boolean).join(" · ");
            return (
              <div
                key={id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{title}</p>
                  {sub ? <p className="truncate text-xs text-muted-foreground">{sub}</p> : null}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-8 shrink-0 gap-1 rounded-lg px-2.5"
                  onClick={() => add(row)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
