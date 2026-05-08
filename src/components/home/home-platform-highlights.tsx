"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, ChevronRight, Headphones, Layers, ListChecks, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { SITE_NAME } from "@/lib/seo/site";
import { usePreferenceFinderStore } from "@/stores/preference-finder-store";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useMarketplaceStats } from "@/hooks/use-marketplace-stats";
import { cn } from "@/lib/utils";

const nf = (n: number) => n.toLocaleString("en-IN");

export function HomePlatformHighlights() {
  const reduceMotion = useReducedMotion();
  const promptSnapshot = usePreferenceFinderStore((s) => s.promptSnapshot);
  const completed = usePreferenceFinderStore((s) => s.completed);

  const { brandCount, listingCount, cityCount } = useMarketplaceStats();

  const hasFullSnapshot =
    Boolean(promptSnapshot.city?.trim()) &&
    Boolean(promptSnapshot.body?.trim()) &&
    Boolean(promptSnapshot.fuel?.trim()) &&
    Boolean(promptSnapshot.budget?.trim());

  const aiBody = useMemo(() => {
    if (completed && hasFullSnapshot) {
      return `Your advisor session is using ${promptSnapshot.city}, ${promptSnapshot.body}, ${promptSnapshot.fuel}, and ${promptSnapshot.budget}. Ranked matches pull from the live catalogue and inventory signals — scroll up to tweak answers anytime.`;
    }
    return "Answer a few smart questions on city, body style, fuel, and budget. We rank real models so your shortlist stays practical and relevant.";
  }, [
    completed,
    hasFullSnapshot,
    promptSnapshot.body,
    promptSnapshot.budget,
    promptSnapshot.city,
    promptSnapshot.fuel,
  ]);

  const decisionBody = useMemo(
    () =>
      "Compare mileage, features, pricing, and ownership cues side by side so you can evaluate models without endless tab switching.",
    []
  );

  const expertBody = useMemo(
    () =>
      "When you narrow it down to a few options, book a short advisor session for practical, unbiased guidance before you decide.",
    []
  );

  const aboutLead = useMemo(() => {
    return `${SITE_NAME} is a research-first stack: ${nf(listingCount)} listings, ${nf(brandCount)} brands, ${nf(
      cityCount
    )} cities, plus AI shortlists and human backup when you want a second opinion.`;
  }, [brandCount, cityCount, listingCount]);

  const items: {
    key: string;
    icon: LucideIcon;
    title: string;
    body: string;
    cta: { href: string; label: string; hash?: string };
  }[] = [
    {
      key: "ai",
      icon: Sparkles,
      title: "AI-guided shortlist",
      body: aiBody,
      cta: { href: "/", label: "Use the questionnaire", hash: "preference-finder-stepper" },
    },
    {
      key: "compare",
      icon: Layers,
      title: "Decision clarity",
      body: decisionBody,
      cta: { href: "/compare/catalogue", label: "Open catalogue compare" },
    },
    {
      key: "expert",
      icon: Headphones,
      title: "Expert backup",
      body: expertBody,
      cta: { href: "/book-expert", label: "Book a session" },
    },
  ];

  return (
    <section className="relative isolate z-[1] overflow-hidden border-y border-border/70 bg-background py-16 sm:py-20 lg:py-24">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <Image
          src="/images/home_whyus_light.png"
          alt=""
          fill
          sizes="100vw"
          className="theme-light-only object-cover object-center opacity-90"
        />
        <Image
          src="/images/home_whyus_dark.png"
          alt=""
          fill
          sizes="100vw"
          className="theme-dark-only object-cover object-center opacity-90"
        />
        <div className="absolute inset-0 bg-background/65" />
        <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-background to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-background to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center justify-center gap-3 text-[11px] font-bold uppercase tracking-[0.28em] text-primary sm:text-xs">
            <span className="hidden h-px w-10 bg-primary/40 sm:inline-block" aria-hidden />
            <span>Why {SITE_NAME}</span>
            <span className="hidden h-px w-10 bg-primary/40 sm:inline-block" aria-hidden />
          </p>
          <h2 className="font-display mt-4 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-[2.25rem] lg:text-[2.5rem]">
            Tools that make your shortlist smarter
          </h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3 md:gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item.key}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex h-full"
            >
              <div className="group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-border/80 bg-card/90 p-7 text-center shadow-app-soft ring-1 ring-foreground/[0.04] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-premium sm:p-8">
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-primary/[0.08] blur-3xl"
                  aria-hidden
                />
                <div className="relative">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/12 text-primary ring-1 ring-primary/20 sm:h-16 sm:w-16">
                    <item.icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.75} />
                  </div>
                </div>

                <h3 className="mt-6 font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
                  {item.title}
                </h3>
                <span
                  aria-hidden
                  className="mx-auto mt-2.5 block h-[3px] w-9 rounded-full bg-primary/70"
                />
                <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
                  {item.body}
                </p>

                <Button
                  variant="outline"
                  className={cn(
                    "mt-7 h-11 w-full justify-between rounded-full border-primary/30 bg-card/80 px-5 text-sm font-semibold text-primary",
                    "hover:border-primary/60 hover:bg-primary/[0.06] hover:text-primary"
                  )}
                  asChild
                >
                  <Link
                    href={item.cta.hash ? `${item.cta.href}#${item.cta.hash}` : item.cta.href}
                  >
                    {item.cta.label}
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-32px" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-12 overflow-hidden rounded-3xl border border-border/80 bg-card shadow-app-soft ring-1 ring-foreground/[0.04]"
        >
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <Image
              src="/images/home_footer_light.png"
              alt=""
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="theme-light-only object-cover object-[85%_center] opacity-100"
            />
            <Image
              src="/images/home_footer_dark.png"
              alt=""
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="theme-dark-only object-cover object-[85%_center] opacity-100"
            />
            <div className="absolute inset-0 bg-linear-to-r from-card from-[5%] via-card/90 to-transparent lg:to-transparent" />
          </div>

          <div className="relative z-10 max-w-2xl px-6 py-8 sm:px-8 sm:py-10 lg:max-w-[min(40rem,58%)] lg:py-12">
            <div>
              <span className="mb-2 block h-px w-10 bg-primary sm:w-12" aria-hidden />
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary sm:text-xs">
                About {SITE_NAME}
              </p>
            </div>

            <p className="font-display mt-5 text-lg font-bold leading-snug tracking-tight text-foreground sm:text-xl lg:text-[1.35rem]">
              {aboutLead}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
              Structured data and honest comparisons stay default; optional human help is here when spreadsheets stop being
              enough — no dealer pressure baked into the UI.
            </p>

            <ul className="mt-6 flex flex-wrap gap-2.5 sm:gap-3">
              {(
                [
                  { icon: ListChecks, label: `${nf(listingCount)} listings` },
                  { icon: ShieldCheck, label: `${nf(brandCount)} brands` },
                  { icon: MapPin, label: `${nf(cityCount)} cities` },
                ] as { icon: LucideIcon; label: string }[]
              ).map((row) => (
                <li
                  key={row.label}
                  className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card/95 px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm sm:text-[13px]"
                >
                  <row.icon className="h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" aria-hidden />
                  {row.label}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap items-center gap-3 sm:gap-4">
              <Button
                variant="primary"
                size="lg"
                className="rounded-full px-6 shadow-[0_12px_32px_-12px_rgba(37,99,235,0.55)]"
                asChild
              >
                <Link href="/about">
                  How we work
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
              >
                Contact
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
