"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Search, Sparkles, X } from "lucide-react";
import { AI_SUGGESTIONS, POPULAR_SEARCHES } from "@/lib/constants";
import { cars } from "@/data";
import type { Car } from "@/data/types";
import { carDetailPath } from "@/lib/seo/paths";
import { searchCatalogue } from "@/lib/client/catalogue-api";
import {
  catalogueResultHref,
  catalogueResultKind,
  catalogueResultLabel,
} from "@/lib/catalogue-href";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRecentSearchStore } from "@/stores/recent-search-store";
import { toast } from "sonner";
import { GA_CATEGORIES, carEntityParams, trackEvent } from "@/lib/analytics";

const MIN_CATALOGUE_QUERY_LEN = 2;
const SEARCH_DEBOUNCE_MS = 320;

function suggestCars(q: string) {
  const t = q.toLowerCase();
  if (!t) return cars.slice(0, 5);
  return cars.filter(
    (c) =>
      `${c.brand} ${c.model}`.toLowerCase().includes(t) ||
      c.variant.toLowerCase().includes(t) ||
      c.city.toLowerCase().includes(t)
  ).slice(0, 6);
}

function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

type SearchPick =
  | { source: "listing"; car: Car }
  | { source: "catalogue"; row: Record<string, unknown> };

function buildPicks(q: string, catalogueRows: Record<string, unknown>[] | undefined): SearchPick[] {
  const local = suggestCars(q);
  const picks: SearchPick[] = [];
  if (q.trim().length >= MIN_CATALOGUE_QUERY_LEN && catalogueRows?.length) {
    for (const row of catalogueRows.slice(0, 6)) {
      if (catalogueResultHref(row)) picks.push({ source: "catalogue", row });
    }
  }
  for (const car of local) {
    picks.push({ source: "listing", car });
  }
  return picks.slice(0, 12);
}

export function SmartSearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, SEARCH_DEBOUNCE_MS);
  const pushRecent = useRecentSearchStore((s) => s.push);
  const recent = useRecentSearchStore((s) => s.items);

  const catalogueEnabled = debouncedQ.trim().length >= MIN_CATALOGUE_QUERY_LEN;

  const { data: catalogueRows = [], isFetching: catalogueLoading } = useQuery({
    queryKey: ["catalogue-search", debouncedQ.trim()],
    queryFn: () => searchCatalogue(debouncedQ.trim()),
    enabled: catalogueEnabled,
    staleTime: 60_000,
  });

  const live = useMemo(() => buildPicks(q, catalogueRows), [q, catalogueRows]);

  async function submitSearch(override?: string) {
    const t = (override ?? q).trim();
    if (!t) return;
    pushRecent(t);

    let catalogueFirstHref: string | null = null;
    if (t.length >= MIN_CATALOGUE_QUERY_LEN) {
      try {
        const rows = await queryClient.fetchQuery({
          queryKey: ["catalogue-search", t],
          queryFn: () => searchCatalogue(t),
          staleTime: 60_000,
        });
        const first = rows?.find((row) => catalogueResultHref(row as Record<string, unknown>));
        if (first) catalogueFirstHref = catalogueResultHref(first as Record<string, unknown>);
      } catch {
        /* network errors fall through to listings */
      }
    }

    const localMatches = suggestCars(t);
    const firstLocal = localMatches[0];

    trackEvent("site_search_submit", {
      event_category: GA_CATEGORIES.search,
      search_term: t.slice(0, 100),
      match_count: (catalogueFirstHref ? 1 : 0) + localMatches.length,
      had_direct_match: Boolean(catalogueFirstHref || firstLocal),
      had_catalogue_hit: Boolean(catalogueFirstHref),
    });

    if (catalogueFirstHref) {
      trackEvent("search", {
        event_category: GA_CATEGORIES.search,
        search_term: t.slice(0, 100),
        destination: "catalogue",
      });
      router.push(catalogueFirstHref);
      toast.message("Opening catalogue", { description: "From live model data." });
      setOpen(false);
      return;
    }

    if (firstLocal) {
      trackEvent("search", {
        event_category: GA_CATEGORIES.search,
        search_term: t.slice(0, 100),
        destination: "listing",
        ...carEntityParams(firstLocal),
      });
      router.push(carDetailPath(firstLocal));
      toast.message("Opening model", { description: `${firstLocal.brand} ${firstLocal.model}` });
    } else {
      router.push("/compare");
      toast.message("No direct match", { description: "Try Compare or refine your keywords." });
    }
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={() =>
            trackEvent("site_search_open", { event_category: GA_CATEGORIES.search, source: "header_bar" })
          }
          className={
            className ??
            "flex h-11 w-full max-w-md items-center gap-2 rounded-full border border-border bg-muted px-4 text-left text-sm text-muted-foreground shadow-inner transition hover:border-primary/35 hover:bg-card"
          }
        >
          <Search className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">Search models, brands, cities…</span>
          <Sparkles className="ml-auto h-4 w-4 text-primary/50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(100vw-2rem,28rem)] border-border bg-popover p-0 shadow-lg" align="end">
        <div className="border-b border-border p-3">
          <div className="flex gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Try “Nexon EV” or “SUV Mumbai”"
              className="h-10"
              onKeyDown={(e) => e.key === "Enter" && submitSearch()}
            />
            {q ? (
              <Button type="button" size="icon" variant="ghost" onClick={() => setQ("")}>
                <X className="h-4 w-4" />
              </Button>
            ) : null}
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => {
                trackEvent("site_search_voice_stub", { event_category: GA_CATEGORIES.search });
                toast.message("Voice search", {
                  description: "Voice input is rolling out — type your query for now, or try a shortcut below.",
                });
              }}
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto p-3 text-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Shortcuts</p>
          <div className="mt-2 space-y-1">
            {AI_SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-secondary"
                onClick={() => {
                  trackEvent("site_search_shortcut", {
                    event_category: GA_CATEGORIES.search,
                    shortcut_label: s.label,
                    link_href: s.query,
                  });
                  router.push(s.query);
                  setOpen(false);
                }}
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-foreground">{s.label}</span>
              </button>
            ))}
          </div>
          {recent.length > 0 ? (
            <>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Recent
              </p>
              <ul className="mt-2 space-y-1">
                {recent.map((r) => (
                  <li key={r}>
                    <button
                      type="button"
                      className="w-full rounded-lg px-2 py-1.5 text-left text-muted-foreground hover:bg-secondary hover:text-foreground"
                      onClick={() => {
                        setQ(r);
                        submitSearch(r);
                      }}
                    >
                      {r}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Popular
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((p) => (
              <li key={p}>
                <button
                  type="button"
                  className="rounded-full border border-border bg-secondary px-3 py-1 text-xs hover:border-primary/30"
                  onClick={() => {
                    setQ(p);
                    pushRecent(p);
                    trackEvent("site_search_popular_chip", {
                      event_category: GA_CATEGORIES.search,
                      term: p,
                    });
                  }}
                >
                  {p}
                </button>
              </li>
            ))}
          </ul>
          <AnimatePresence>
            {q.length >= 1 ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 border-t border-border pt-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Matches</p>
                  {catalogueLoading && q.trim().length >= MIN_CATALOGUE_QUERY_LEN ? (
                    <span className="text-[10px] text-muted-foreground">Searching catalogue…</span>
                  ) : null}
                </div>
                <ul className="mt-2 space-y-1">
                  {live.map((pick, idx) => {
                    if (pick.source === "listing") {
                      const c = pick.car;
                      return (
                        <li key={`listing-${c.id}-${idx}`}>
                          <button
                            type="button"
                            className="flex w-full justify-between gap-2 rounded-lg px-2 py-2 text-left hover:bg-secondary"
                            onClick={() => {
                              trackEvent("site_search_pick_match", {
                                event_category: GA_CATEGORIES.search,
                                result_kind: "listing",
                                ...carEntityParams(c),
                              });
                              router.push(carDetailPath(c));
                            }}
                          >
                            <span className="min-w-0 text-foreground">
                              {c.brand} {c.model}
                            </span>
                            <span className="shrink-0 text-xs text-primary">{c.city}</span>
                          </button>
                        </li>
                      );
                    }
                    const row = pick.row;
                    const href = catalogueResultHref(row);
                    if (!href) return null;
                    const kind = catalogueResultKind(row);
                    const label = catalogueResultLabel(row);
                    return (
                      <li key={`cat-${String(row.id ?? label)}-${idx}`}>
                        <button
                          type="button"
                          className="flex w-full justify-between gap-2 rounded-lg px-2 py-2 text-left hover:bg-secondary"
                          onClick={() => {
                            trackEvent("site_search_pick_match", {
                              event_category: GA_CATEGORIES.search,
                              result_kind: kind,
                              search_label: label.slice(0, 120),
                            });
                            router.push(href);
                          }}
                        >
                          <span className="min-w-0 text-foreground">{label}</span>
                          <span className="shrink-0 text-xs capitalize text-muted-foreground">{kind}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {live.length === 0 && q.trim().length >= MIN_CATALOGUE_QUERY_LEN && !catalogueLoading ? (
                  <p className="mt-2 text-xs text-muted-foreground">No catalogue or listing matches yet.</p>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        <div className="border-t border-border p-2">
          <Button className="w-full" size="sm" type="button" onClick={() => submitSearch()}>
            Open best match
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
