"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PartyPopper, Sparkles, X } from "lucide-react";
import { AI_ACCESS_MONTHLY_INR, AI_ACCESS_PERIOD_DAYS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Particle = { id: number; x: number; delay: number; duration: number; hue: number; size: number };

function useParticles(count: number, open: boolean): Particle[] {
  return useMemo(() => {
    if (!open) return [];
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 12 + (i * 76) % 76,
      delay: i * 0.045,
      duration: 1.1 + (i % 5) * 0.12,
      hue: (i * 47) % 360,
      size: 5 + (i % 4),
    }));
  }, [count, open]);
}

export function CarAiWelcomeCelebration({
  open,
  onClose,
  vehicleLabel,
  reduceMotion,
  scrollTargetId,
}: {
  open: boolean;
  onClose: () => void;
  vehicleLabel: string;
  reduceMotion: boolean;
  /** Element to scroll into view when dialog opens (e.g. chat heading id) */
  scrollTargetId: string;
}) {
  const titleId = useId();
  const descId = useId();
  const primaryRef = useRef<HTMLButtonElement>(null);
  const particles = useParticles(14, open);

  useEffect(() => {
    if (!open) return;
    const t = window.requestAnimationFrame(() => {
      document.getElementById(scrollTargetId)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(t);
  }, [open, scrollTargetId, reduceMotion]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => primaryRef.current?.focus(), 180);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="ai-welcome-root"
          role="presentation"
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center sm:p-6"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.28 }}
        >
          <motion.div
            role="presentation"
            className="absolute inset-0 cursor-default bg-black/55 backdrop-blur-[2px]"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className={cn(
              "relative z-[101] w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-600/35",
              "bg-[linear-gradient(155deg,rgba(39,39,42,0.97)_0%,rgba(9,9,11,0.99)_45%,rgba(3,3,5,1)_100%)]",
              "shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_0_80px_-20px_rgba(0,0,0,0.55),0_40px_80px_-32px_rgba(0,0,0,0.85)]"
            )}
            initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.9 }}
          >
            <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-zinc-600/28 blur-[90px]" aria-hidden />
            <div className="pointer-events-none absolute -bottom-28 -left-16 h-52 w-52 rounded-full bg-zinc-800/25 blur-[80px]" aria-hidden />

            {!reduceMotion ? (
              <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                {particles.map((p) => (
                  <motion.span
                    key={p.id}
                    className="absolute rounded-full opacity-90 shadow-sm"
                    style={{
                      left: `${p.x}%`,
                      top: "42%",
                      width: p.size,
                      height: p.size,
                      background: `hsl(${p.hue} 78% 62%)`,
                    }}
                    initial={{ y: 0, opacity: 0, scale: 0 }}
                    animate={{
                      y: [-8, -120 - (p.id % 4) * 28],
                      x: [(p.id % 2 === 0 ? 1 : -1) * (12 + p.id * 3), 0],
                      opacity: [0, 1, 1, 0],
                      scale: [0, 1, 1, 0.4],
                      rotate: [0, (p.id % 2 === 0 ? 1 : -1) * 180],
                    }}
                    transition={{
                      duration: p.duration,
                      delay: 0.15 + p.delay,
                      ease: [0.22, 1, 0.36, 1],
                      times: [0, 0.12, 0.7, 1],
                    }}
                  />
                ))}
              </div>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-xl text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/60"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative px-5 pb-7 pt-8 max-sm:pb-[max(1.75rem,env(safe-area-inset-bottom,0px))] sm:px-8 sm:pb-8 sm:pt-10">
              <motion.div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-zinc-600/55 to-zinc-800/45 ring-2 ring-zinc-500/35"
                initial={reduceMotion ? false : { scale: 0.5, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 22, delay: reduceMotion ? 0 : 0.08 }}
              >
                <PartyPopper className="h-8 w-8 text-white drop-shadow-md" aria-hidden strokeWidth={1.75} />
              </motion.div>

              <motion.p
                id={titleId}
                className="mt-6 text-center font-display text-2xl font-bold tracking-tight text-white sm:text-[1.65rem]"
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : 0.12, duration: 0.35 }}
              >
                You&apos;re all set — welcome to Autolokate AI
              </motion.p>

              <motion.p
                id={descId}
                className="mt-3 text-center text-sm leading-relaxed text-white/88 sm:text-[0.9375rem]"
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : 0.18, duration: 0.35 }}
              >
                Thanks for unlocking AI for <span className="font-semibold text-white">{vehicleLabel}</span>. You now have{" "}
                <span className="font-semibold text-zinc-300">{AI_ACCESS_PERIOD_DAYS} days</span> of listing-aware answers
                on this device — explore specs, pricing context, ownership cues, and comparisons with calm, skimmable replies.
              </motion.p>

              <motion.div
                className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: reduceMotion ? 0 : 0.24 }}
              >
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  ₹{AI_ACCESS_MONTHLY_INR} pass active
                </span>
              </motion.div>

              <motion.div
                className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : 0.28, duration: 0.35 }}
              >
                <Button
                  ref={primaryRef}
                  type="button"
                  className="h-11 rounded-xl bg-linear-to-r from-zinc-700 via-zinc-600 to-zinc-700 px-6 text-sm font-semibold text-white shadow-lg shadow-black/30 hover:brightness-110"
                  onClick={onClose}
                >
                  Explore with AI — ask a question
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
