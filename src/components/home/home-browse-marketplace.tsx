"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, Building2, CarFront, ChevronRight, LayoutGrid, MapPin, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { brands } from "@/data";
import { BrandLogo } from "@/components/brands/brand-logo";
import { GA_CATEGORIES, trackEvent } from "@/lib/analytics";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useMarketplaceStats } from "@/hooks/use-marketplace-stats";
import { cn } from "@/lib/utils";

const nf = (n: number) => n.toLocaleString("en-IN");

const cardBase =
  "group relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md";

export function HomeBrowseMarketplace() {
  const reduceMotion = useReducedMotion();
  const brandPreview = brands.slice(0, 6);
  const { brandCount, listingCount, cityCount } = useMarketplaceStats();

  const cards = [
    {
      href: "/brands",
      eventLabel: "home_marketplace_brands",
      accent: "emerald" as const,
      icon: Building2,
      eyebrow: "Directory",
      title: "Browse by brand",
      description: `${nf(brandCount)} OEM marks with live inventory signals — jump straight into a maker you trust.`,
      cta: "Open brand index",
      decoration: (
        <div className="pointer-events-none absolute -right-6 bottom-16 h-36 w-36 rounded-full bg-emerald-500/[0.07] blur-3xl" aria-hidden />
      ),
      logos: (
        <div className="mt-3 rounded-xl border border-border/60 bg-muted/30 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Popular makers</p>
          <div className="flex flex-wrap items-center gap-2">
            {brandPreview.map((b) => (
              <BrandLogo key={b} brand={b} size={32} className="rounded-lg border border-border/60 bg-background shadow-sm" />
            ))}
          </div>
        </div>
      ),
      className: cn(cardBase, "border-border/90 ring-1 ring-border/40 hover:border-emerald-500/25 hover:ring-emerald-500/10"),
      accentBar: "bg-emerald-600",
    },
    {
      href: "/cars/explore",
      eventLabel: "home_marketplace_explore",
      accent: "orange" as const,
      icon: LayoutGrid,
      eyebrow: "Discovery order",
      title: "Explore mixed listings",
      description: `${nf(listingCount)} cars across ${nf(cityCount)} cities — filters, sort, and a grid tuned for browsing, not endless scrolling.`,
      cta: "Open explore catalog",
      decoration: (
        <CarFront
          className="pointer-events-none absolute -right-4 bottom-8 h-32 w-32 text-orange-500/12 transition duration-500 group-hover:text-orange-500/18 sm:h-40 sm:w-40"
          strokeWidth={1.15}
          aria-hidden
        />
      ),
      logos: (
        <div className="mt-3 rounded-xl border border-orange-200/50 bg-orange-50/40 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-orange-900/70">How you&apos;ll browse</p>
          <ul className="grid gap-2 text-sm text-orange-950/90">
            <li className="flex items-center gap-2 rounded-lg bg-background/80 px-2.5 py-1.5 ring-1 ring-orange-100/80">
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-orange-600" aria-hidden />
              <span>Filters &amp; facets</span>
            </li>
            <li className="flex items-center gap-2 rounded-lg bg-background/80 px-2.5 py-1.5 ring-1 ring-orange-100/80">
              <ArrowUpDown className="h-4 w-4 shrink-0 text-orange-600" aria-hidden />
              <span>Sort that sticks</span>
            </li>
            <li className="flex items-center gap-2 rounded-lg bg-background/80 px-2.5 py-1.5 ring-1 ring-orange-100/80">
              <MapPin className="h-4 w-4 shrink-0 text-orange-600" aria-hidden />
              <span>Multi-city grid</span>
            </li>
          </ul>
        </div>
      ),
      className: cn(
        cardBase,
        "border-orange-200/60 ring-1 ring-orange-100/70 hover:border-orange-300/90 hover:ring-orange-200/50"
      ),
      accentBar: "bg-orange-500",
    },
    {
      href: "/compare/catalogue",
      eventLabel: "home_marketplace_compare",
      accent: "slate" as const,
      icon: BarChart3,
      eyebrow: "Specs-first",
      title: "Compare catalogue variants",
      description:
        "Stack up to three new-car variants with ex-showroom signals — mileage, features, and price bands in one view.",
      cta: "Start catalogue compare",
      decoration: (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(15,23,42,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.05) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
          aria-hidden
        />
      ),
      logos: (
        <div className="mt-3 rounded-xl border border-border/60 bg-muted/35 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Side-by-side</p>
          <ul className="grid gap-2 text-sm text-foreground/90">
            <li className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/90 px-2.5 py-1.5">
              <span className="text-muted-foreground">Variants</span>
              <span className="font-semibold tabular-nums text-primary">up to 3</span>
            </li>
            <li className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/90 px-2.5 py-1.5">
              <span className="text-muted-foreground">Signals</span>
              <span className="font-medium">Mileage · features</span>
            </li>
            <li className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/90 px-2.5 py-1.5">
              <span className="text-muted-foreground">Pricing</span>
              <span className="font-medium">Ex-showroom bands</span>
            </li>
          </ul>
        </div>
      ),
      className: cn(cardBase, "border-border/90 ring-1 ring-border/35 hover:border-primary/30 hover:ring-primary/15"),
      accentBar: "bg-slate-600",
    },
  ] as const;

  return (
    <section className="relative z-1 mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
      <div className="border-t border-border/60 pt-8 sm:pt-10">
        <div className="mx-auto max-w-2xl text-center lg:max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary sm:text-[0.8125rem]">
            Browse the marketplace
          </p>
          <h2 className="font-display mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Three doors into the catalog
          </h2>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:text-base">
            Same underlying data as the rest of Autolokate — pick the surface that matches how you like to search.
          </p>
        </div>

        <div className="mx-auto mt-6 flex max-w-xl flex-wrap items-center justify-center gap-2 sm:mt-8 sm:gap-2.5">
          <span className="rounded-full border border-border/80 bg-secondary/70 px-3.5 py-1.5 text-xs font-medium text-foreground sm:px-4 sm:text-sm">
            {nf(brandCount)} brands
          </span>
          <span className="text-muted-foreground/50" aria-hidden>
            ·
          </span>
          <span className="rounded-full border border-border/80 bg-secondary/70 px-3.5 py-1.5 text-xs font-medium text-foreground sm:px-4 sm:text-sm">
            {nf(listingCount)} listings
          </span>
          <span className="text-muted-foreground/50" aria-hidden>
            ·
          </span>
          <span className="rounded-full border border-border/80 bg-secondary/70 px-3.5 py-1.5 text-xs font-medium text-foreground sm:px-4 sm:text-sm">
            {nf(cityCount)} cities
          </span>
        </div>

        <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 lg:grid-cols-3 lg:items-stretch lg:gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.href}
              className="flex h-full min-h-0"
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-24px" }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={card.href}
                className={cn(card.className, "h-full w-full")}
                onClick={() =>
                  trackEvent("cta_click", {
                    event_category: GA_CATEGORIES.home,
                    event_label: card.eventLabel,
                    link_href: card.href,
                    section: "browse_marketplace",
                  })
                }
              >
                <div className={cn("h-1 w-full shrink-0", card.accentBar)} aria-hidden />
                {card.decoration}
                <div
                  className={cn(
                    "relative z-1 flex min-h-0 flex-1 flex-col p-5 sm:p-6",
                    card.accent === "orange" && "bg-linear-to-b from-orange-50/30 via-card to-card"
                  )}
                >
                  <div className="min-h-0 flex-1">
                    <div
                      className={cn(
                        "inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide",
                        card.accent === "orange"
                          ? "border-orange-200/90 bg-orange-50/95 text-orange-950"
                          : card.accent === "emerald"
                            ? "border-emerald-200/80 bg-emerald-50/90 text-emerald-950"
                            : "border-border bg-muted/70 text-foreground"
                      )}
                    >
                      <card.icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                      {card.eyebrow}
                    </div>

                    <h3 className="mt-4 font-display text-xl font-bold leading-snug tracking-tight text-foreground sm:text-[1.375rem]">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                      {card.description}
                    </p>

                    {card.logos}
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/60 pt-3">
                    <span
                      className={cn(
                        "text-sm font-semibold sm:text-[0.9375rem]",
                        card.accent === "orange" ? "text-orange-900" : "text-primary"
                      )}
                    >
                      {card.cta}
                    </span>
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/80 bg-background/90 text-foreground transition group-hover:border-primary/35 group-hover:bg-primary/5",
                        card.accent === "orange" && "group-hover:border-orange-300/60 group-hover:bg-orange-50/80"
                      )}
                    >
                      <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
