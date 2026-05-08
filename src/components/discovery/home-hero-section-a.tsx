"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GA_CATEGORIES, trackEvent } from "@/lib/analytics";
import { cars } from "@/data";
import { cn } from "@/lib/utils";

type Props = {
  reduceMotion: boolean;
  allCities: string[];
  recommendationLine: string;
  onViewMatches: () => void;
};

/**
 * Hero variant A — editorial single-column.
 *
 * Centered chip + giant headline with a blue gradient phrase + one-line subhead +
 * primary blue CTA + ghost CTA + trust strip. No video, no embedded card.
 * Closest to the autolokate.com hero pattern, easiest to keep beautiful in
 * both light and dark modes since everything is token-driven.
 */
export function HomeHeroSectionA({ reduceMotion }: Props) {
  const totalListings = cars.length;
  const totalBrands = new Set(cars.map((c) => c.brand)).size;
  const totalCities = new Set(cars.map((c) => c.city)).size;

  const startQuestionnaire = () => {
    trackEvent("hero_start_journey_click", {
      event_category: GA_CATEGORIES.home,
      hero_variant: "a",
    });
    document
      .getElementById("preference-finder-stepper")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative z-1 overflow-hidden border-b border-border/70 bg-background bg-hero-mesh">
      {/* Soft blue ambient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="hero-ambient-orb hero-ambient-orb-a absolute" />
        <div className="hero-ambient-orb hero-ambient-orb-b absolute" />
      </div>

      <div className="relative z-2 mx-auto flex min-h-[min(82svh,46rem)] max-w-5xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6 sm:py-24 lg:py-28">
        <motion.span
          initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px] shadow-primary/60" />
          Safety-checked research
        </motion.span>

        <motion.h1
          initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          className="font-display max-w-4xl text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-[4.5rem] lg:leading-[1.02]"
        >
          Find the right car in a{" "}
          <span className="bg-linear-to-r from-[#3b82f6] to-[#60a5fa] bg-clip-text text-transparent">
            2-minute conversation
          </span>
          .
        </motion.h1>

        <motion.p
          initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
          className="mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg"
        >
          Tell us 4 things — city, body, fuel, budget — and see ranked picks from{" "}
          <span className="font-semibold text-foreground">
            {totalListings.toLocaleString("en-IN")} live listings
          </span>
          .
        </motion.p>

        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Button size="lg" onClick={startQuestionnaire} className="group px-7">
            Start the 2-min questionnaire
            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link
              href="/cars"
              onClick={() =>
                trackEvent("hero_browse_all_click", {
                  event_category: GA_CATEGORIES.home,
                  hero_variant: "a",
                })
              }
            >
              Browse all {totalListings.toLocaleString("en-IN")} cars
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={cn(
            "mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground sm:text-sm",
            "[&>span]:flex [&>span]:items-center [&>span]:gap-2"
          )}
        >
          <span>
            <strong className="font-semibold tabular-nums text-foreground">
              {totalListings.toLocaleString("en-IN")}
            </strong>{" "}
            listings
          </span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/40" aria-hidden />
          <span>
            <strong className="font-semibold tabular-nums text-foreground">{totalBrands}</strong>{" "}
            brands
          </span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/40" aria-hidden />
          <span>
            <strong className="font-semibold tabular-nums text-foreground">{totalCities}</strong>{" "}
            cities
          </span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/40" aria-hidden />
          <span>No dealer pressure</span>
        </motion.div>
      </div>
    </section>
  );
}
