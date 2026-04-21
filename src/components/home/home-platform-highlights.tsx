"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Headphones, Layers, Sparkles } from "lucide-react";
import { SITE_NAME } from "@/lib/seo/site";
import { usePreferenceFinderStore } from "@/stores/preference-finder-store";
import { Card, CardContent } from "@/components/ui/card";
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
    return `The hero questionnaire walks through city, body style, fuel, and budget. We rank models using ${nf(
      brandCount
    )} brands and ${nf(listingCount)} listings so the shortlist stays actionable, not theoretical.`;
  }, [
    completed,
    hasFullSnapshot,
    promptSnapshot.body,
    promptSnapshot.budget,
    promptSnapshot.city,
    promptSnapshot.fuel,
    brandCount,
    listingCount,
  ]);

  const decisionBody = useMemo(() => {
    return `Inventory listings expose price, mileage, and ownership cues; catalogue compare lines up ex-showroom variants without tab sprawl — ${nf(
      listingCount
    )} listings across ${nf(cityCount)} cities in one research flow.`;
  }, [listingCount, cityCount]);

  const expertBody = useMemo(() => {
    return `When you are down to two or three options, book a 15-minute advisor call — same secure checkout and advice-only positioning as the rest of ${SITE_NAME}.`;
  }, []);

  const aboutLead = useMemo(() => {
    return `${SITE_NAME} is a research-first stack: ${nf(listingCount)} listings, ${nf(brandCount)} brands, ${nf(
      cityCount
    )} cities, plus AI shortlists and human backup when you want a second opinion.`;
  }, [brandCount, cityCount, listingCount]);

  const items: {
    key: string;
    icon: LucideIcon;
    iconClass: string;
    title: string;
    body: string;
    cta: { href: string; label: string; hash?: string };
  }[] = [
    {
      key: "ai",
      icon: Sparkles,
      iconClass: "bg-primary/10 text-primary",
      title: "AI-guided shortlist",
      body: aiBody,
      cta: { href: "/", label: "Use the questionnaire", hash: "preference-finder-stepper" },
    },
    {
      key: "compare",
      icon: Layers,
      iconClass: "bg-primary/12 text-primary",
      title: "Decision clarity",
      body: decisionBody,
      cta: { href: "/compare/catalogue", label: "Open catalogue compare" },
    },
    {
      key: "expert",
      icon: Headphones,
      iconClass: "bg-emerald-500/12 text-emerald-800",
      title: "Expert backup",
      body: expertBody,
      cta: { href: "/book-expert", label: "Book a session" },
    },
  ];

  return (
    <section className="relative z-[1] border-y border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3 md:gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item.key}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="flex h-full flex-col border-border bg-card shadow-app-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-premium">
                <CardContent className="flex flex-1 flex-col p-6 sm:p-7">
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl",
                      item.iconClass
                    )}
                  >
                    <item.icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <p className="mt-5 text-base font-semibold text-foreground">{item.title}</p>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                  <Button variant="outline" className="mt-6 w-full justify-between gap-2 sm:w-auto" asChild>
                    <Link
                      href={item.cta.hash ? `${item.cta.href}#${item.cta.hash}` : item.cta.href}
                      className="inline-flex"
                    >
                      {item.cta.label}
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-32px" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 overflow-hidden rounded-2xl border border-border bg-linear-to-br from-secondary/40 via-card to-background p-6 shadow-sm sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">About {SITE_NAME}</p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">{aboutLead}</p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Structured data and honest comparisons stay default; optional human help is here when spreadsheets stop being
            enough — no dealer pressure baked into the UI.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="cta" asChild>
              <Link href="/about">How we work</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/contact">Contact</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
