"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  Clock,
  Headphones,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GA_CATEGORIES, trackEvent } from "@/lib/analytics";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

const trustChips = [
  { icon: Clock, label: "15-minute call" },
  { icon: ShieldCheck, label: "Secure checkout" },
  { icon: Check, label: "Advice only" },
] as const;

const shellClass =
  "relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-linear-to-br from-emerald-950 via-[#050806] to-[#030a08] text-zinc-100 antialiased shadow-[0_20px_64px_-32px_rgba(0,0,0,0.72),0_0_0_1px_rgba(16,185,129,0.08),0_0_48px_-20px_rgba(16,185,129,0.14)] ring-1 ring-emerald-500/15 scheme-dark";

const ambient = (
  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden>
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_130%_90%_at_50%_-25%,rgba(16,185,129,0.14),transparent_58%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_50%,rgba(20,184,166,0.08),transparent_50%)]" />
    <div className="absolute -left-[18%] top-0 h-[62%] min-h-[160px] w-[75%] rounded-full bg-emerald-500/9 blur-[100px]" />
    <div className="absolute -right-[10%] top-[10%] h-[42%] w-[55%] rounded-full bg-teal-400/7 blur-[85px]" />
    <div className="absolute bottom-0 left-1/2 h-[32%] w-[95%] -translate-x-1/2 rounded-full bg-emerald-600/6 blur-[80px]" />
    <div className="absolute bottom-0 right-0 h-[25%] w-[40%] rounded-full bg-amber-500/5 blur-[70px]" />
    <div
      className="absolute inset-0 opacity-[0.28]"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)`,
        backgroundSize: "56px 56px",
      }}
    />
  </div>
);

export type HomeExpertBookCtaProps = {
  className?: string;
  /**
   * `banner` — wide horizontal layout for the home page (theme-aware blue design).
   * `sidebar` — narrow column under filter panels (desktop, listing pages).
   * `compact` — full-width single column when the filter sidebar is hidden (mobile, listing pages).
   * `embed` — single band under media (e.g. Indian Drive Guide); minimal height.
   */
  variant?: "banner" | "sidebar" | "compact" | "embed";
  /** Passed to `book_call_click` analytics */
  trackSource?: string;
};

/**
 * Expert booking pitch.
 * - `banner` uses the new home-page design (theme-aware, blue/primary, showroom backdrop image).
 * - Other variants keep the emerald book-expert visual language used across listing pages.
 */
export function HomeExpertBookCta({
  className,
  variant = "banner",
  trackSource,
}: HomeExpertBookCtaProps) {
  const reduceMotion = useReducedMotion();
  const resolvedSource =
    trackSource ??
    (variant === "banner"
      ? "home_expert_banner"
      : variant === "sidebar"
        ? "listing_sidebar"
        : variant === "embed"
          ? "car_detail_idg_embed"
          : "listing_compact");

  if (variant === "banner") {
    return (
      <BannerExpertCta
        className={className}
        reduceMotion={reduceMotion}
        resolvedSource={resolvedSource}
      />
    );
  }

  return (
    <motion.div
      className={cn(
        shellClass,
        variant === "embed" ? "rounded-xl" : "rounded-2xl",
        className
      )}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {ambient}
      <div
        className={cn(
          "pointer-events-none absolute top-0 h-px bg-linear-to-r from-transparent via-emerald-400/28 to-transparent",
          variant === "embed" ? "inset-x-3.5" : "inset-x-4 sm:inset-x-6"
        )}
        aria-hidden
      />

      <div
        className={cn(
          "relative",
          variant === "embed" && "px-3.5 py-3 sm:px-4 sm:py-3.5",
          variant === "sidebar" && "px-4 py-5 sm:px-4 sm:py-5",
          variant === "compact" && "px-4 py-4 sm:py-5"
        )}
      >
        {variant === "embed" ? (
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">Expert consultation</p>
              <p className="mt-1 text-[11px] leading-snug text-zinc-200 sm:text-xs">
                15-minute advisory call on this listing, your budget, and city — fee shown before you pay.
              </p>
            </div>
            <Button
              variant="expert"
              size="sm"
              className="h-10 w-full shrink-0 gap-1.5 rounded-lg px-3.5 text-xs font-semibold shadow-md shadow-emerald-900/30 sm:w-auto sm:min-w-[9.5rem] sm:px-4"
              asChild
            >
              <Link href="/book-expert" onClick={() =>
                trackEvent("book_call_click", {
                  event_category: GA_CATEGORIES.conversion,
                  source: resolvedSource,
                })
              }>
                <Headphones className="h-3.5 w-3.5" aria-hidden />
                Book session
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                Expert consultation
              </p>
              <h3
                className={cn(
                  "font-display font-bold leading-snug tracking-tight text-white",
                  variant === "sidebar"
                    ? "mt-2 text-[1.05rem] leading-tight sm:text-lg"
                    : "mt-2 text-lg sm:text-xl"
                )}
              >
                Talk to an expert
              </h3>
              <div className="mt-2.5 h-px bg-linear-to-r from-emerald-500/45 via-emerald-400/18 to-transparent" />
              {variant === "sidebar" ? (
                <>
                  <p className="mt-3 text-xs leading-relaxed text-zinc-200">
                    Your shortlist, budget, and city — reviewed by a senior advisor in one structured call.
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                    Pick a time, pay securely online, and we&apos;ll confirm your slot with everything you need before the
                    call.
                  </p>
                </>
              ) : (
                <p className="mt-2.5 text-xs leading-relaxed text-zinc-200 sm:text-sm">
                  Your shortlist, budget, and city reviewed in one structured call. Book a slot and pay securely online.
                </p>
              )}
              <ul
                className={cn(
                  "space-y-1.5 text-zinc-200",
                  variant === "sidebar" ? "mt-3 text-[11px] leading-snug" : "mt-2.5 text-[10px] sm:text-[11px]"
                )}
              >
                {trustChips.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden />
                    {label}
                  </li>
                ))}
              </ul>
              <div
                className={cn(
                  "inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/12 font-medium text-emerald-100",
                  variant === "sidebar"
                    ? "mt-3 px-2.5 py-1.5 text-[11px]"
                    : "mt-2.5 px-2 py-1 text-[10px] sm:text-[11px]"
                )}
              >
                <Headphones className="h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden />
                {variant === "sidebar"
                  ? "Full fee is clear before you complete payment"
                  : "You'll see the full fee before you pay"}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Button
                variant="expert"
                size={variant === "sidebar" ? "default" : "lg"}
                className={cn(
                  "w-full gap-2 rounded-xl font-semibold shadow-lg shadow-emerald-900/35",
                  variant === "compact"
                    ? "h-11 text-sm sm:h-12 sm:text-base"
                    : variant === "sidebar"
                      ? "h-11 text-sm"
                      : "h-10 text-sm"
                )}
                asChild
              >
                <Link href="/book-expert" onClick={() =>
                trackEvent("book_call_click", {
                  event_category: GA_CATEGORIES.conversion,
                  source: resolvedSource,
                })
              }>
                  Book expert session
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Link>
              </Button>
              <p className="text-center text-[10px] leading-relaxed text-zinc-300 sm:text-[11px]">
                Advisory call · pay only if you&apos;re happy with the price shown
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/** Home-page banner — theme-aware blue design with showroom backdrop image. */
function BannerExpertCta({
  className,
  reduceMotion,
  resolvedSource,
}: {
  className?: string;
  reduceMotion: boolean;
  resolvedSource: string;
}) {
  return (
    <motion.div
      className={cn(
        "relative isolate overflow-hidden rounded-3xl border border-border/80 bg-card text-foreground shadow-app-soft ring-1 ring-foreground/[0.04]",
        className
      )}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <Image
          src="/images/home_session_light.png"
          alt=""
          fill
          sizes="100vw"
          className="theme-light-only object-cover object-[78%_center] lg:object-[72%_center]"
        />
        <Image
          src="/images/home_session_dark.png"
          alt=""
          fill
          sizes="100vw"
          className="theme-dark-only object-cover object-[78%_center] lg:object-[72%_center]"
        />
        <div className="absolute inset-0 bg-linear-to-r from-card via-card/85 to-card/0 lg:via-card/65" />
        <div className="absolute inset-y-0 right-0 w-1/3 bg-linear-to-l from-card/35 to-transparent" />
      </div>

      <div
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-primary/35 to-transparent"
        aria-hidden
      />

      <div className="relative z-10 grid gap-6 p-6 sm:p-8 lg:grid-cols-12 lg:items-center lg:gap-8 lg:p-10">
        <div className="min-w-0 lg:col-span-8">
          <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-primary sm:text-xs">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/12 text-primary ring-1 ring-primary/20">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            </span>
            Expert consultation
          </p>
          <h3 className="font-display mt-4 text-balance text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-[1.85rem] lg:text-[2.05rem]">
            Still deciding? Talk to a car expert
          </h3>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
            Share your shortlist, budget, and city — reviewed by a senior advisor in one structured call. Get
            honest advice to help you choose with confidence.
          </p>

          <ul className="mt-5 flex flex-wrap gap-2.5">
            {trustChips.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/90 px-3.5 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm sm:text-[13px]"
              >
                <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                {label}
              </li>
            ))}
          </ul>

          <div className="mt-3.5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.08] px-3.5 py-1.5 text-xs font-semibold text-primary sm:text-[13px]">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            You&apos;ll see the full fee before you pay anything
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col items-stretch gap-2 lg:col-span-4 lg:items-end">
          <Button
            asChild
            size="lg"
            variant="primary"
            className="h-12 w-full max-w-sm gap-2 rounded-2xl px-6 text-sm font-semibold shadow-[0_12px_32px_-12px_rgba(37,99,235,0.55)] sm:text-base lg:max-w-none lg:min-w-[14rem]"
          >
            <Link
              href="/book-expert"
              onClick={() =>
                trackEvent("book_call_click", {
                  event_category: GA_CATEGORIES.conversion,
                  source: resolvedSource,
                })
              }
            >
              <CalendarCheck className="h-4 w-4" aria-hidden />
              Book expert session
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <p className="inline-flex items-center justify-center gap-1.5 text-[11px] leading-relaxed text-muted-foreground lg:justify-end lg:text-right">
            <Check className="h-3 w-3 text-primary" aria-hidden />
            One session fee · no obligation until you confirm
          </p>
        </div>
      </div>

    </motion.div>
  );
}
