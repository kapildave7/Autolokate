"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GA_CATEGORIES, trackEvent } from "@/lib/analytics";
import { hasAuthTokens } from "@/lib/client/auth-storage";
import { usePreferenceFinderStore } from "@/stores/preference-finder-store";
import { HeroBackgroundVideo } from "@/components/discovery/hero-background-video";
import { HomeHeroPreferenceWizard } from "@/components/discovery/hero-preference/home-hero-preference-wizard";
import { cn } from "@/lib/utils";

/** Hero subcopy by session state — concise, neutral product tone. */
function getHeroLines(params: {
  loggedIn: boolean;
  recentlyRestartedSession: boolean;
  journeyCompleted: boolean;
}): [string, string] {
  const { loggedIn, recentlyRestartedSession, journeyCompleted } = params;
  if (!loggedIn) {
    return [
      "Use the guided questionnaire in the card to shape a comparable shortlist.",
      "Sign in to save your session and align recommendations with live inventory.",
    ];
  }
  if (recentlyRestartedSession) {
    return [
      "You have started a new preference session—continue in the card.",
      "Complete the steps again to regenerate a ranked shortlist from the catalogue.",
    ];
  }
  if (journeyCompleted) {
    return [
      "Your ranked recommendations appear below—review and compare from there.",
      "Adjust answers in the card at any time; rankings refresh when you save changes.",
    ];
  }
  return [
    "Answer each step to refine which models surface in your shortlist.",
    "Selections save to your account; you can pause and resume without losing progress.",
  ];
}

type Props = {
  reduceMotion: boolean;
  allCities: string[];
  recommendationLine: string;
  onViewMatches: () => void;
};

function Caret({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "ml-1 inline-block h-[0.95em] w-[3px] translate-y-px animate-pulse rounded-sm bg-white align-middle sm:h-[1em] sm:w-1",
        className
      )}
      aria-hidden
    />
  );
}

/** Home-only hero: single questionnaire card over background video. */
export function HomeHeroSection({ reduceMotion, allCities, recommendationLine, onViewMatches }: Props) {
  const loggedIn = useSyncExternalStore(
    () => () => {},
    () => hasAuthTokens(),
    () => false
  );
  const answerHistory = usePreferenceFinderStore((s) => s.answerHistory);
  const journeyCompleted = usePreferenceFinderStore((s) => s.completed);
  const recentlyRestartedSession = usePreferenceFinderStore((s) => s.recentlyRestartedSession);

  const [line1, line2] = useMemo(
    () =>
      getHeroLines({
        loggedIn,
        recentlyRestartedSession,
        journeyCompleted,
      }),
    [loggedIn, recentlyRestartedSession, journeyCompleted]
  );

  const heroCtaLabel = answerHistory.length > 0 || journeyCompleted ? "Continue" : "Get started";

  const heroCharTotal = line1.length + line2.length;

  const [typedLen, setTypedLen] = useState(() => (reduceMotion ? heroCharTotal : 0));
  const typingDone = typedLen >= heroCharTotal;

  useEffect(() => {
    if (reduceMotion) {
      setTypedLen(heroCharTotal);
      return;
    }
    setTypedLen(0);
    let i = 0;
    const stepMs = 72;
    const id = window.setInterval(() => {
      i += 1;
      setTypedLen(i);
      if (i >= heroCharTotal) window.clearInterval(id);
    }, stepMs);
    return () => window.clearInterval(id);
  }, [reduceMotion, line1, line2, heroCharTotal]);

  const line1Visible = line1.slice(0, Math.min(typedLen, line1.length));
  const line2Visible = line2.slice(0, Math.max(0, typedLen - line1.length));
  const caretOnLine1 = !typingDone && typedLen <= line1.length;
  const caretOnLine2 = !typingDone && typedLen > line1.length;

  const scrollToWizard = () => {
    document.getElementById("preference-finder-stepper")?.scrollIntoView({ behavior: "smooth", block: "start" });
    trackEvent("hero_start_journey_click", { event_category: GA_CATEGORIES.home });
  };

  return (
    <section className="relative z-1 min-h-[min(100svh,56rem)] overflow-hidden border-b border-border/70 bg-black shadow-app-soft">
      <div className="absolute inset-0 z-0">
        <HeroBackgroundVideo minimalScrims />
        <div className="pointer-events-none absolute inset-0 bg-black/70" aria-hidden />
      </div>

      <div className="relative z-2 mx-auto flex min-h-[min(100svh,56rem)] max-w-7xl flex-col justify-center gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:px-8 lg:py-20">
        <motion.div
          className="min-w-0 max-w-2xl text-left lg:max-w-[min(28rem,46%)] xl:max-w-xl"
          initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm ring-1 ring-white/10 backdrop-blur-sm">
            Autolokate
          </p>
          <div
            className={cn(
              "mt-7 flex gap-4 sm:gap-5",
              "drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]"
            )}
            aria-live="polite"
          >
            <span
              className="mt-1 h-[3.35rem] w-1 shrink-0 self-stretch rounded-full bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.25)] sm:mt-1.5 sm:h-auto sm:min-h-18"
              aria-hidden
            />
            <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
              <span className="block max-w-xl text-balance text-2xl font-semibold leading-[1.2] tracking-tight text-white sm:text-3xl sm:leading-[1.18] lg:text-[2.125rem] xl:text-[2.25rem] xl:leading-[1.15]">
                {line1Visible}
                {caretOnLine1 ? <Caret /> : null}
              </span>
              <span className="block max-w-xl text-balance text-lg font-medium leading-snug tracking-tight text-white/82 sm:text-xl sm:leading-snug lg:text-[1.35rem] lg:leading-snug">
                {line2Visible}
                {caretOnLine2 ? <Caret /> : null}
              </span>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-start gap-3">
            <Button
              type="button"
              size="lg"
              className="rounded-full border-0 bg-white px-8 text-black shadow-lg shadow-black/30 transition hover:bg-white/90"
              onClick={scrollToWizard}
            >
              {heroCtaLabel}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-white/45 bg-white/10 px-7 text-white shadow-md backdrop-blur-md transition hover:border-white/70 hover:bg-white/15"
              asChild
            >
              <Link href="/cars">Browse all cars</Link>
            </Button>
          </div>
        </motion.div>

        <div className="w-full max-w-md shrink-0 self-end sm:max-w-lg lg:self-center">
          <HomeHeroPreferenceWizard
            reduceMotion={reduceMotion}
            allCities={allCities}
            recommendationLine={recommendationLine}
            onViewMatches={onViewMatches}
          />
        </div>
      </div>
    </section>
  );
}

export { HomeHeroSection as HeroContainer };
