"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { BadgeCheck, Building2, CarFront, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  reduceMotion: boolean;
  onContinue: () => void;
};

/** Confetti blast: strictly white + dark green (no grey or extra hues). */
const CONFETTI_WHITE = "#ffffff";
const CONFETTI_DARK_GREEN_A = "#14532d";
const CONFETTI_DARK_GREEN_B = "#166534";
const CONFETTI_COLORS = [
  CONFETTI_WHITE,
  CONFETTI_WHITE,
  CONFETTI_WHITE,
  CONFETTI_DARK_GREEN_A,
  CONFETTI_DARK_GREEN_B,
  CONFETTI_DARK_GREEN_A,
];

const ICON_DARK_GREEN = "text-[#14532d] dark:text-[#15803d]";

/** Last burst delay 2550ms; allow particles to settle before congrats copy. */
const CONFETTI_PHASE_MS = 2900;
/** Time to read success copy before auto-advance. */
const CONGRATS_BEFORE_SUMMARY_MS = 2800;
/** No-match screen: slightly longer read before auto-advance. */
const NO_MATCH_BEFORE_SUMMARY_MS = 3200;

/** Multi-burst sequence — toned down vs. flashy. */
function startConfettiSequence(reduceMotion: boolean): () => void {
  if (reduceMotion) return () => {};

  const base = {
    colors: CONFETTI_COLORS,
    disableForReducedMotion: true,
  } as const;

  const timeouts: number[] = [];
  const bursts: { delay: number; fn: () => void }[] = [
    {
      delay: 0,
      fn: () => {
        void confetti({
          ...base,
          particleCount: 52,
          spread: 52,
          startVelocity: 34,
          origin: { x: 0.5, y: 0.32 },
          ticks: 220,
          gravity: 1.02,
          scalar: 0.95,
        });
      },
    },
    {
      delay: 200,
      fn: () => {
        void confetti({ ...base, particleCount: 26, angle: 125, spread: 48, origin: { x: 0.02, y: 0.62 }, ticks: 200 });
        void confetti({ ...base, particleCount: 26, angle: 55, spread: 48, origin: { x: 0.98, y: 0.62 }, ticks: 200 });
      },
    },
    {
      delay: 480,
      fn: () => {
        void confetti({
          ...base,
          particleCount: 44,
          spread: 64,
          startVelocity: 28,
          origin: { x: 0.5, y: 0.44 },
          ticks: 210,
          gravity: 1.06,
        });
      },
    },
    {
      delay: 760,
      fn: () => {
        void confetti({ ...base, particleCount: 22, angle: 90, spread: 96, origin: { x: 0.15, y: 0.55 }, ticks: 190 });
        void confetti({ ...base, particleCount: 22, angle: 90, spread: 96, origin: { x: 0.85, y: 0.55 }, ticks: 190 });
      },
    },
    {
      delay: 1040,
      fn: () => {
        void confetti({
          ...base,
          particleCount: 56,
          spread: 68,
          startVelocity: 26,
          origin: { x: 0.5, y: 0.48 },
          ticks: 240,
          gravity: 0.94,
          scalar: 1.02,
        });
      },
    },
    {
      delay: 1320,
      fn: () => {
        void confetti({ ...base, particleCount: 30, angle: 118, spread: 42, origin: { x: 0, y: 0.72 }, ticks: 200 });
        void confetti({ ...base, particleCount: 30, angle: 62, spread: 42, origin: { x: 1, y: 0.72 }, ticks: 200 });
      },
    },
    {
      delay: 1680,
      fn: () => {
        void confetti({
          ...base,
          particleCount: 40,
          spread: 76,
          origin: { x: 0.5, y: 0.56 },
          startVelocity: 20,
          ticks: 190,
          gravity: 1.1,
        });
      },
    },
    {
      delay: 2020,
      fn: () => {
        void confetti({
          ...base,
          particleCount: 72,
          spread: 92,
          startVelocity: 30,
          origin: { x: 0.5, y: 0.36 },
          ticks: 260,
          gravity: 1,
          scalar: 0.9,
        });
      },
    },
    {
      delay: 2380,
      fn: () => {
        void confetti({ ...base, particleCount: 20, angle: 130, spread: 38, origin: { x: 0.08, y: 0.68 }, ticks: 170 });
        void confetti({ ...base, particleCount: 20, angle: 50, spread: 38, origin: { x: 0.92, y: 0.68 }, ticks: 170 });
      },
    },
    {
      delay: 2550,
      fn: () => {
        void confetti({
          ...base,
          particleCount: 42,
          spread: 60,
          origin: { x: 0.5, y: 0.5 },
          ticks: 200,
          gravity: 1.04,
        });
      },
    },
  ];

  let raf0 = 0;
  raf0 = window.requestAnimationFrame(() => {
    bursts.forEach(({ delay, fn }) => {
      timeouts.push(window.setTimeout(fn, delay));
    });
  });

  return () => {
    window.cancelAnimationFrame(raf0);
    timeouts.forEach((id) => window.clearTimeout(id));
  };
}

/** Sparse sparkle trail — white / dark green only. */
function startConfettiSparkleLoop(reduceMotion: boolean): () => void {
  if (reduceMotion) return () => {};

  let rafId = 0;
  let tickCount = 0;
  const end = performance.now() + 2100;
  const spark = () => ({
    colors: CONFETTI_COLORS,
    disableForReducedMotion: true,
    particleCount: 2,
    spread: 360,
    ticks: 100,
    gravity: 0.4,
    scalar: 0.68,
    startVelocity: 10,
  });

  const tick = () => {
    const now = performance.now();
    if (now >= end) return;
    tickCount += 1;
    if (tickCount % 5 === 0 && Math.random() > 0.5) {
      void confetti({
        ...spark(),
        origin: { x: 0.2 + Math.random() * 0.6, y: 0.12 + Math.random() * 0.22 },
      });
    }
    rafId = window.requestAnimationFrame(tick);
  };
  rafId = window.requestAnimationFrame(tick);

  return () => window.cancelAnimationFrame(rafId);
}

/**
 * Shown when the questionnaire completes but the advisor returns zero catalogue matches.
 * No confetti — calm empty state with a path to browse by brand.
 */
export function PreferenceNoMatchesCompletion({ reduceMotion, onContinue }: Props) {
  const advancedRef = useRef(false);
  const onContinueRef = useRef(onContinue);
  onContinueRef.current = onContinue;

  const finish = useCallback(() => {
    if (advancedRef.current) return;
    advancedRef.current = true;
    onContinueRef.current();
  }, []);

  useEffect(() => {
    const delay = reduceMotion ? 500 : NO_MATCH_BEFORE_SUMMARY_MS;
    const id = window.setTimeout(finish, delay);
    return () => window.clearTimeout(id);
  }, [finish, reduceMotion]);

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -8, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
      className="flex min-h-[min(20rem,48vh)] flex-col items-center justify-center px-6 py-12 text-center sm:px-10 sm:py-14"
    >
      <div className="flex max-w-md flex-col items-center">
        <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/50 text-foreground shadow-sm">
          <CarFront className="h-7 w-7 opacity-85" aria-hidden />
        </div>

        <h2 className="font-display text-balance text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          We couldn&apos;t find a matching car in the catalogue
        </h2>

        <p className="mt-4 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
          With the preferences you selected, nothing in our current inventory lines up end-to-end. It happens—narrow
          filters can land outside what&apos;s listed right now. Your answers are saved.
        </p>

        <p className="mt-4 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
          No need to start over: explore by brand to discover similar models, or continue to your summary below.
        </p>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-8 h-9 gap-2 rounded-xl border-border px-4 text-sm font-medium"
          asChild
        >
          <Link href="/brands">
            <Building2 className="h-4 w-4 opacity-80" aria-hidden />
            Explore by brand
          </Link>
        </Button>

        <p className="mt-10 text-xs text-muted-foreground/90">Continuing to your summary automatically…</p>
      </div>
    </motion.div>
  );
}

export function PreferenceCompletionCelebration({ reduceMotion, onContinue }: Props) {
  const [phase, setPhase] = useState<"confetti" | "congrats">(() => (reduceMotion ? "congrats" : "confetti"));
  const advancedRef = useRef(false);
  const onContinueRef = useRef(onContinue);
  onContinueRef.current = onContinue;

  const finish = useCallback(() => {
    if (advancedRef.current) return;
    advancedRef.current = true;
    onContinueRef.current();
  }, []);

  useEffect(() => {
    const stopBurst = startConfettiSequence(reduceMotion);
    const stopSparkle = startConfettiSparkleLoop(reduceMotion);
    return () => {
      stopBurst();
      stopSparkle();
    };
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      setPhase("congrats");
      return;
    }
    const id = window.setTimeout(() => setPhase("congrats"), CONFETTI_PHASE_MS);
    return () => window.clearTimeout(id);
  }, [reduceMotion]);

  useEffect(() => {
    if (phase !== "congrats") return;
    const delay = reduceMotion ? 650 : CONGRATS_BEFORE_SUMMARY_MS;
    const id = window.setTimeout(finish, delay);
    return () => window.clearTimeout(id);
  }, [phase, finish, reduceMotion]);

  /** One restrained burst when success copy appears — white + dark green only. */
  useEffect(() => {
    if (phase !== "congrats" || reduceMotion) return;
    const id = window.setTimeout(() => {
      void confetti({
        colors: [CONFETTI_WHITE, CONFETTI_DARK_GREEN_A, CONFETTI_DARK_GREEN_B],
        particleCount: 42,
        spread: 72,
        startVelocity: 28,
        origin: { x: 0.5, y: 0.42 },
        ticks: 200,
        gravity: 0.98,
        scalar: 0.98,
        disableForReducedMotion: true,
      });
    }, 100);
    return () => window.clearTimeout(id);
  }, [phase, reduceMotion]);

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -8, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
      className="flex min-h-[min(20rem,48vh)] flex-col items-center justify-center px-6 py-12 text-center sm:px-10 sm:py-14"
    >
      <AnimatePresence mode="wait">
        {phase === "confetti" ? (
          <motion.div
            key="confetti-phase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="flex max-w-md flex-col items-center"
          >
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/80 bg-muted/50 text-foreground shadow-sm">
              <Loader2 className="h-7 w-7 animate-spin opacity-80" aria-hidden />
            </div>
            <h2 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Questionnaire complete
            </h2>
            <p className="mt-3 font-medium text-foreground/95">Finishing up…</p>
            <p className="mt-3 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
              Saving your answers securely — almost there.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="congrats-phase"
            initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="flex max-w-md flex-col items-center"
          >
            <motion.div
              initial={reduceMotion ? undefined : { scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.05, type: "spring", stiffness: 340, damping: 26 }}
              className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted/40 shadow-sm"
            >
              <motion.div
                className={ICON_DARK_GREEN}
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        scale: [1, 1.04, 1],
                      }
                }
                transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.2 }}
              >
                <BadgeCheck className="h-9 w-9" strokeWidth={2} aria-hidden />
              </motion.div>
            </motion.div>

            <p className="max-w-sm text-pretty text-sm leading-snug text-muted-foreground">
              Congratulations — your preference card is ready.
            </p>

            <h2 className="font-display mt-5 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Questionnaire complete
            </h2>

            <p className="mt-4 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
              Every answer is saved. Your summary opens next.
            </p>

            <p className="mt-10 text-xs text-muted-foreground/90">Continuing automatically…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
