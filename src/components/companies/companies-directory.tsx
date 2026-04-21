"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, ChevronRight, Loader2, MapPin, ShieldCheck, Star } from "lucide-react";
import { PageFade } from "@/components/shared/page-fade";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDealers } from "@/lib/client/dealer-api";
import { cn, partnerMonogram } from "@/lib/utils";

const PAGE_SIZE = 9;

export function CompaniesDirectory() {
  const [page, setPage] = useState(1);

  const { data: dealers = [], isPending, isError, error, refetch } = useQuery({
    queryKey: ["dealers-list"],
    queryFn: () => getDealers(),
    staleTime: 120_000,
  });

  const cityCount = useMemo(() => new Set(dealers.map((d) => d.city_id).filter(Boolean)).size, [dealers]);
  const pageCount = Math.max(1, Math.ceil(dealers.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = dealers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <PageFade>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-secondary/80 via-background to-background">
        <div className="pointer-events-none absolute -right-20 top-0 h-80 w-80 rounded-full bg-primary/[0.08] blur-3xl" />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-8 lg:gap-12">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Dealer network</p>
              <h1 className="font-display mt-3 text-3xl text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
                Partner dealers &amp; showrooms
              </h1>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Live partners from the Autolokate API — ratings, contact details, and verified badges where available.
              </p>
            </div>
            <div className="grid w-full gap-3 sm:w-auto sm:min-w-[280px] sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-border bg-card/90 px-5 py-4 shadow-sm ring-1 ring-foreground/[0.04]">
                <p className="font-display text-2xl text-primary">{isPending ? "—" : dealers.length}</p>
                <p className="text-xs font-medium text-muted-foreground">Partners</p>
              </div>
              <div className="rounded-2xl border border-border bg-card/90 px-5 py-4 shadow-sm ring-1 ring-foreground/[0.04]">
                <p className="font-display text-2xl text-primary">{isPending ? "—" : cityCount || "—"}</p>
                <p className="text-xs font-medium text-muted-foreground">City refs</p>
              </div>
              <div className="rounded-2xl border border-border bg-card/90 px-5 py-4 shadow-sm ring-1 ring-foreground/[0.04]">
                <p className="font-display text-2xl text-primary">Live</p>
                <p className="text-xs font-medium text-muted-foreground">API data</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">All partners</h2>
            <p className="text-sm text-muted-foreground">From GET /v1/dealers · open a profile for contact and reviews.</p>
          </div>
          <Badge variant="secondary" className="w-fit gap-1.5 py-1.5 pl-2 pr-3">
            <Building2 className="h-3.5 w-3.5" aria-hidden />
            {isPending ? "…" : `${dealers.length} dealers`}
          </Badge>
        </div>

        {isPending ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Loading dealers…</p>
          </div>
        ) : null}

        {isError ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Could not load dealers."}
            </p>
            <Button type="button" variant="outline" className="mt-4" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : null}

        {!isPending && !isError && dealers.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            No dealers returned from the API yet.
          </p>
        ) : null}

        {!isPending && !isError && paged.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paged.map((co) => {
              const mono = partnerMonogram(co.name);
              const rating = co.rating != null && Number.isFinite(co.rating) ? co.rating : null;
              const rc = co.review_count ?? 0;
              return (
                <Link key={co.id} href={`/companies/${co.id}`} className="group block h-full">
                  <Card
                    className={cn(
                      "h-full overflow-hidden border-border bg-card shadow-sm transition-all duration-300",
                      "hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/5"
                    )}
                  >
                    <div className="relative h-44 overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-900 sm:h-48">
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/35 to-transparent" />
                      {co.is_verified ? (
                        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary shadow-sm ring-1 ring-black/5">
                          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                          Verified
                        </span>
                      ) : null}
                      <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
                        <div
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white text-lg font-bold tracking-tight text-primary shadow-lg"
                          aria-hidden
                        >
                          {mono}
                        </div>
                        <div className="min-w-0 text-right text-white">
                          <p className="flex items-center justify-end gap-1 text-sm font-semibold tabular-nums">
                            <Star className="h-4 w-4 fill-warn-soft-foreground text-warn-soft-foreground" aria-hidden />
                            {rating != null ? rating.toFixed(1) : "—"}
                          </p>
                          <p className="text-[11px] text-white/80">{rc.toLocaleString("en-IN")} reviews</p>
                        </div>
                      </div>
                    </div>
                    <CardContent className="space-y-3 p-5 pt-4">
                      <div>
                        <h3 className="text-lg font-bold leading-snug text-foreground group-hover:text-primary">{co.name}</h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {co.address ?? "Address on file"}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-medium text-secondary-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                          {co.city_id ? `City ${co.city_id.slice(0, 8)}…` : "India"}
                        </span>
                        {co.partner_type ? (
                          <span className="rounded-full border border-border bg-background px-2.5 py-1 font-medium capitalize text-foreground">
                            {co.partner_type.replace(/_/g, " ")}
                          </span>
                        ) : null}
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                        View profile
                        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : null}

        {!isPending && !isError && pageCount > 1 ? (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
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
    </PageFade>
  );
}
