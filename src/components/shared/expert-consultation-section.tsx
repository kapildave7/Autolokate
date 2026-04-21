"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Clock, Headphones, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GA_CATEGORIES, trackEvent } from "@/lib/analytics";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

const shell =
  "relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-linear-to-b from-emerald-950 via-[#061510] to-[#020807] text-zinc-100 antialiased shadow-[0_24px_80px_-40px_rgba(0,0,0,0.85),0_0_0_1px_rgba(16,185,129,0.1),0_0_56px_-24px_rgba(16,185,129,0.18)] ring-1 ring-emerald-500/20 scheme-dark sm:rounded-[1.35rem]";

function ExpertAmbient() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(16,185,129,0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_100%_80%,rgba(20,184,166,0.1),transparent_50%)]" />
      <div className="absolute -left-[20%] top-0 h-[70%] w-[85%] rounded-full bg-emerald-500/10 blur-[110px]" />
      <div className="absolute -right-[12%] bottom-0 h-[45%] w-[60%] rounded-full bg-teal-500/8 blur-[90px]" />
      <div
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}

export type ExpertConsultationSectionProps = {
  className?: string;
  /** Analytics source for `book_call_click` */
  trackSource: string;
  placement: "car-detail" | "compare";
  /** e.g. "Hyundai Creta" — only used when placement is car-detail */
  vehicleLabel?: string;
  /**
   * Dense horizontal layout for toolbars (e.g. under hero, above section nav).
   * Omit min-height flex growth used in multi-column car detail layouts.
   */
  compact?: boolean;
};

/**
 * Standalone expert band — not wrapped in a white Card. Fills available column width/height.
 */
const shellCompact =
  "relative overflow-hidden rounded-xl border border-emerald-500/30 bg-linear-to-b from-emerald-950 via-[#061510] to-[#020807] text-zinc-100 antialiased shadow-[0_12px_40px_-28px_rgba(0,0,0,0.75)] ring-1 ring-emerald-500/20 scheme-dark sm:rounded-2xl";

export function ExpertConsultationSection({
  className,
  trackSource,
  placement,
  vehicleLabel,
  compact = false,
}: ExpertConsultationSectionProps) {
  const reduceMotion = useReducedMotion();

  const isCar = placement === "car-detail";
  const v = vehicleLabel?.trim();

  const headline = isCar
    ? "Unpack this listing with a real person"
    : "Make sense of your shortlist";

  const headlineCompact = isCar ? "Talk to a specialist" : "Compare with an expert";

  const lead = isCar
    ? v
      ? `Specs and price for the ${v} are on screen — a senior advisor can help you interpret them: fair ask, what to verify on history, and how it fits your city and monthly budget.`
      : "Specs and price are on screen — a senior advisor can help you interpret them: fair ask, what to verify on history, and how it fits your city and budget."
    : "You’ve put cars head to head — a specialist can explain what the differences mean for daily driving, running costs, and what to validate next before you narrow down.";

  const leadCompact = isCar
    ? v
      ? `15-minute call on ${v}: pricing, running costs & what to check before you buy.`
      : "15-minute guidance on pricing, running costs, and what to verify."
    : "A specialist can walk through your shortlist and trade-offs in one short call.";

  const bullets = [
    { icon: Clock, text: "One focused 15-minute session" },
    { icon: Check, text: "Guidance only — no inventory pitch" },
    { icon: Headphones, text: "Full fee before you confirm payment" },
  ] as const;

  if (compact) {
    return (
      <motion.section
        className={cn(shellCompact, "w-full shrink-0", className)}
        aria-labelledby="expert-consultation-heading"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <ExpertAmbient />
        <div className="relative z-[2] flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-300/95">
              <Sparkles className="h-3 w-3 shrink-0 text-emerald-300" aria-hidden />
              Expert consultation
            </p>
            <h2 id="expert-consultation-heading" className="font-display text-base font-bold leading-tight text-white sm:text-lg">
              {headlineCompact}
            </h2>
            <p className="text-[11px] leading-snug text-zinc-300 sm:text-xs">{leadCompact}</p>
            <p className="text-[10px] leading-relaxed text-emerald-200/85">
              <span className="whitespace-nowrap">15 min session</span>
              <span className="mx-1.5 text-emerald-500/80">·</span>
              <span className="whitespace-nowrap">No inventory pitch</span>
              <span className="mx-1.5 text-emerald-500/80">·</span>
              <span className="whitespace-nowrap">Fee before you pay</span>
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-1 sm:items-stretch sm:justify-center">
            <Button
              variant="expert"
              size="sm"
              className="h-9 w-full gap-1.5 rounded-lg px-4 text-xs shadow-md shadow-emerald-950/40 sm:h-10 sm:w-auto sm:min-w-[10.5rem] sm:text-sm"
              asChild
            >
              <Link
                href="/book-expert"
                onClick={() =>
                  trackEvent("book_call_click", {
                    event_category: GA_CATEGORIES.conversion,
                    source: trackSource,
                  })
                }
              >
                <Headphones className="h-3.5 w-3.5" aria-hidden />
                Book consultation
                <ArrowRight className="h-3.5 w-3.5 opacity-90" aria-hidden />
              </Link>
            </Button>
            <p className="text-center text-[9px] leading-tight text-zinc-400 sm:max-w-[11rem] sm:text-left sm:text-[10px]">
              Independent advice — optional booking after you see the session price.
            </p>
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      className={cn(
        shell,
        "flex min-h-0 flex-col",
        /* Compare page: do not flex-grow with the spec matrix column — that caused huge empty space inside this card */
        placement === "compare" && "w-full shrink-0",
        placement === "car-detail" && "xl:min-h-[13rem] xl:flex-1",
        className
      )}
      aria-labelledby="expert-consultation-heading"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-32px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <ExpertAmbient />
      <div
        className="pointer-events-none absolute inset-x-5 top-0 z-[1] h-px bg-linear-to-r from-transparent via-emerald-400/35 to-transparent sm:inset-x-7"
        aria-hidden
      />

      <div className="relative z-[2] flex min-h-0 flex-1 flex-col justify-between gap-6 p-5 sm:p-6 lg:p-7">
        <div className="min-w-0 space-y-3">
          <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300">
            <Sparkles className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
            Expert consultation
          </p>
          <h2
            id="expert-consultation-heading"
            className="font-display break-words text-[1.35rem] font-bold leading-tight tracking-tight text-white sm:text-2xl lg:text-[1.65rem] lg:leading-snug"
          >
            {headline}
          </h2>
          <p className="max-w-xl break-words text-sm leading-relaxed text-zinc-200 sm:text-[0.9375rem]">{lead}</p>

          <ul className="grid gap-2.5 pt-1 sm:grid-cols-3 sm:gap-3">
            {bullets.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-start gap-2 rounded-xl border border-emerald-400/25 bg-emerald-950/50 px-3 py-2.5 text-[11px] leading-snug text-zinc-100 sm:text-xs"
              >
                <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <Button
            variant="expert"
            size="lg"
            className="h-11 w-full gap-2 rounded-xl shadow-lg shadow-emerald-950/50 sm:h-12 sm:w-auto sm:min-w-[13rem] sm:px-6"
            asChild
          >
            <Link
              href="/book-expert"
              onClick={() =>
                trackEvent("book_call_click", {
                  event_category: GA_CATEGORIES.conversion,
                  source: trackSource,
                })
              }
            >
              <Headphones className="h-4 w-4" aria-hidden />
              Book consultation
              <ArrowRight className="h-4 w-4 opacity-90" aria-hidden />
            </Link>
          </Button>
          <p className="text-center text-[10px] leading-relaxed text-zinc-300 sm:max-w-[14rem] sm:text-left sm:text-[11px]">
            Independent of this listing — you choose whether to book after seeing the session price.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
