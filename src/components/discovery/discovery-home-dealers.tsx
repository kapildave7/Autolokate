"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Loader2, MapPin, ShieldCheck, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDealers } from "@/lib/client/dealer-api";
import { cn, partnerMonogram } from "@/lib/utils";
import { GA_CATEGORIES, trackEvent } from "@/lib/analytics";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const PREVIEW = 6;

export function DiscoveryHomeDealers() {
  const reduceMotion = useReducedMotion();
  const { data: dealers = [], isPending, isError, refetch } = useQuery({
    queryKey: ["dealers-home-strip"],
    queryFn: () => getDealers(),
    staleTime: 120_000,
  });

  const top = dealers.slice(0, PREVIEW);

  if (isError) {
    return (
      <section className="relative z-[1] border-y border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
            <p className="text-sm text-muted-foreground">Partner dealers could not be loaded. Try again in a moment.</p>
            <Button type="button" variant="outline" className="mt-4" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (!isPending && dealers.length === 0) {
    return null;
  }

  return (
    <section className="relative z-[1] border-y border-border bg-gradient-to-b from-secondary/40 via-background to-background">
      <div className="pointer-events-none absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-primary/[0.06] blur-3xl" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Partner network</p>
            <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Find a dealer near you
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Verified partners with ratings, contact details, and reviews — same directory as our car listings.
            </p>
          </div>
          <Button variant="outline" className="shrink-0 gap-1.5 self-start sm:self-auto" asChild>
            <Link
              href="/companies"
              onClick={() =>
                trackEvent("cta_click", {
                  event_category: GA_CATEGORIES.navigation,
                  event_label: "dealers_view_all",
                  link_href: "/companies",
                  section: "discovery_home",
                })
              }
            >
              View all dealers
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>

        {isPending ? (
          <div className="mt-10 flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Loading partner dealers…</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {top.map((co, i) => {
              const mono = partnerMonogram(co.name);
              const rating = co.rating != null && Number.isFinite(co.rating) ? co.rating : null;
              const rc = co.review_count ?? 0;
              return (
                <motion.div
                  key={co.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={`/companies/${co.id}`}
                    className="group block h-full"
                    onClick={() =>
                      trackEvent("cta_click", {
                        event_category: GA_CATEGORIES.navigation,
                        event_label: "dealer_card",
                        link_href: `/companies/${co.id}`,
                        section: "discovery_home",
                      })
                    }
                  >
                    <Card
                      className={cn(
                        "h-full overflow-hidden border-border bg-card shadow-sm transition-all duration-300",
                        "hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/5"
                      )}
                    >
                      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-900 sm:h-40">
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/35 to-transparent" />
                        {co.is_verified ? (
                          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary shadow-sm ring-1 ring-black/5">
                            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                            Verified
                          </span>
                        ) : null}
                        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white text-base font-bold tracking-tight text-primary shadow-lg"
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
                      <CardContent className="space-y-2 p-4 pt-3">
                        <h3 className="text-base font-bold leading-snug text-foreground group-hover:text-primary">{co.name}</h3>
                        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{co.address ?? "Address on file"}</p>
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
                        <span className="inline-flex items-center gap-1 pt-1 text-sm font-semibold text-primary">
                          View profile
                          <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {!isPending && dealers.length > PREVIEW ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Showing {PREVIEW} of {dealers.length} partners.{" "}
            <Link href="/companies" className="font-semibold text-primary underline-offset-4 hover:underline">
              Browse the full directory
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  );
}
