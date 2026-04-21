"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { BarChart3, Leaf, Sparkles, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Car } from "@/data/types";
import { getSimilarCars } from "@/data";
import { videos } from "@/data/videos";
import { useCarMatchScore } from "@/hooks/use-car-match-score";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import { CarCard } from "./car-card";

function idgWalkaroundEmbedUrl(carId: string): string {
  let h = 0;
  for (let i = 0; i < carId.length; i++) h = (Math.imul(31, h) + carId.charCodeAt(i)) | 0;
  const v = videos[Math.abs(h) % videos.length];
  return v.embedUrl;
}

const PriceHistoryChart = dynamic(
  () => import("./price-history-chart").then((m) => m.PriceHistoryChart),
  { ssr: false, loading: () => <div className="h-56 animate-pulse rounded-xl bg-secondary/50" /> }
);

function PremiumSection({
  children,
  className,
  reduceMotion,
}: {
  children: ReactNode;
  className?: string;
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function CarDetailPremiumSections({ car }: { car: Car }) {
  const match = useCarMatchScore(car);
  const similar = getSimilarCars(car, 3);
  const reduceMotion = useReducedMotion();

  return (
    <div className="space-y-10 sm:space-y-12">
      <PremiumSection reduceMotion={reduceMotion}>
        <section className="grid gap-4 sm:gap-5 lg:grid-cols-2">
          <Card className="group border-zinc-200/70 bg-linear-to-br from-zinc-50/90 to-transparent shadow-md transition-all duration-300 hover:border-zinc-300/80 hover:shadow-lg dark:border-zinc-600/30 dark:bg-card dark:bg-linear-to-br dark:from-zinc-500/12 dark:via-card dark:to-zinc-700/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-500/12 text-zinc-800 shadow-inner transition-transform duration-200 group-hover:scale-105 dark:text-zinc-300">
                  <Sparkles className="h-5 w-5" />
                </span>
                AI match score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-5xl text-zinc-800 dark:text-zinc-200">{match}%</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Based on your saved budget, fuel &amp; body preferences. Tune in dashboard → profile prefs.
              </p>
              <Button
                variant="outline"
                className="mt-3 border-zinc-300/80 bg-white text-zinc-950 shadow-sm transition-colors hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-600/50 dark:bg-zinc-900/65 dark:text-zinc-50 dark:hover:bg-zinc-800/75 dark:hover:text-zinc-50"
                size="sm"
                asChild
              >
                <Link href="/dashboard/user">Adjust preferences</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="group border-orange-200/65 bg-linear-to-br from-orange-50/95 to-orange-50/25 shadow-md transition-all duration-300 hover:border-orange-300/75 hover:shadow-lg dark:border-orange-500/30 dark:bg-card dark:bg-linear-to-br dark:from-orange-500/14 dark:via-card dark:to-orange-600/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15 text-orange-800 shadow-inner transition-transform duration-200 group-hover:scale-105 dark:text-orange-300">
                  <Leaf className="h-5 w-5" />
                </span>
                Carbon footprint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-orange-900 dark:text-orange-300">{car.carbonScore}</p>
              <p className="text-xs uppercase text-muted-foreground">Eco score / 100</p>
              <p className="mt-3 text-sm text-muted-foreground">
                {car.fuel === "Electric"
                  ? "Grid-mix-adjusted estimate vs similar listings."
                  : "Estimated tailpipe + well-to-wheel benchmark vs segment average (informational)."}
              </p>
            </CardContent>
          </Card>
        </section>
      </PremiumSection>

      <PremiumSection reduceMotion={reduceMotion}>
        <section className="relative overflow-hidden rounded-3xl border border-zinc-200/50 bg-linear-to-br from-zinc-500/[0.05] via-card to-card p-6 shadow-md transition-shadow duration-300 hover:shadow-lg sm:p-8 dark:border-zinc-600/25">
          <div className="pointer-events-none absolute -right-10 top-0 h-36 w-36 rounded-full bg-zinc-400/12 blur-3xl motion-reduce:hidden" aria-hidden />
          <h2 className="flex items-center gap-3 text-xl font-bold text-foreground">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-500/12 text-zinc-800 shadow-inner dark:text-zinc-300">
              <Video className="h-6 w-6" />
            </span>
            Video walkaround
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{car.videoTitle}</p>
          <div
            className={cn(
              "mt-4 aspect-video overflow-hidden rounded-2xl border-2 border-zinc-300/60 bg-black shadow-xl transition-all duration-300",
              "hover:border-zinc-400/70 hover:shadow-2xl hover:shadow-black/15 motion-reduce:transition-none",
              "dark:border-zinc-600/35"
            )}
          >
            <iframe
              className="h-full w-full"
              src={idgWalkaroundEmbedUrl(car.id)}
              title="Walkaround — Indian Drive Guide"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      </PremiumSection>

      <PremiumSection reduceMotion={reduceMotion}>
        <section className="relative overflow-hidden rounded-3xl border border-zinc-200/50 bg-linear-to-br from-zinc-500/[0.04] via-card to-card p-6 shadow-md transition-shadow duration-300 hover:shadow-lg sm:p-8 dark:border-zinc-600/25">
          <div className="pointer-events-none absolute left-0 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-zinc-400/10 blur-3xl motion-reduce:hidden" aria-hidden />
          <h2 className="flex items-center gap-3 text-xl font-bold text-foreground">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-500/12 text-zinc-800 shadow-inner dark:text-zinc-300">
              <BarChart3 className="h-6 w-6" />
            </span>
            Price history
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">Indicative trend from listing data.</p>
          <Card className="mt-4 border-border/80 bg-card/95 p-4 shadow-inner transition-all duration-300 hover:border-foreground/10 hover:shadow-md">
            <PriceHistoryChart data={car.priceHistory} />
          </Card>
        </section>
      </PremiumSection>

      <PremiumSection reduceMotion={reduceMotion}>
        <section className="relative overflow-hidden rounded-3xl border border-zinc-200/50 bg-linear-to-br from-zinc-500/[0.05] via-card to-card p-6 shadow-md transition-shadow duration-300 hover:shadow-lg sm:p-8 dark:border-zinc-600/25">
          <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 rounded-full bg-zinc-400/10 blur-2xl motion-reduce:hidden" aria-hidden />
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-xl font-bold text-foreground">Similar cars</h2>
            <Button variant="ghost" size="sm" className="transition-colors hover:bg-muted" asChild>
              <Link href="/compare">View in compare</Link>
            </Button>
          </div>
          <div className="mt-5 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((c, i) => (
              <div key={c.id} className="min-h-0 transition-transform duration-300 hover:-translate-y-1 motion-reduce:hover:translate-y-0">
                <CarCard car={c} index={i} />
              </div>
            ))}
          </div>
        </section>
      </PremiumSection>
    </div>
  );
}
