"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BarChart3,
  Building2,
  Check,
  ChevronRight,
  Compass,
  Fuel,
  IndianRupee,
  ListChecks,
  MapPin,
} from "lucide-react";
import { brands } from "@/data";
import { BrandLogo } from "@/components/brands/brand-logo";
import { GA_CATEGORIES, trackEvent } from "@/lib/analytics";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useMarketplaceStats } from "@/hooks/use-marketplace-stats";
import { cn } from "@/lib/utils";

const nf = (n: number) => n.toLocaleString("en-IN");

type CardKind = "default" | "highlighted";

const cardBase =
  "group relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border bg-card p-6 transition duration-300 hover:-translate-y-0.5 sm:p-7";

function EyebrowPill({
  icon: Icon,
  label,
}: {
  icon: typeof Building2;
  label: string;
}) {
  return (
    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}

function CardFooter({ label, kind }: { label: string; kind: CardKind }) {
  return (
    <div className="mt-auto flex shrink-0 items-center justify-between gap-3 pt-6">
      <span className="text-sm font-semibold text-primary sm:text-[0.95rem]">
        {label}
      </span>
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition group-hover:bg-primary group-hover:text-primary-foreground",
          kind === "highlighted"
            ? "border-primary/40 bg-primary text-primary-foreground"
            : "border-border bg-background/80 text-foreground group-hover:border-primary"
        )}
      >
        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
      </span>
    </div>
  );
}

export function HomeBrowseMarketplace() {
  const reduceMotion = useReducedMotion();
  const brandPreview = brands.slice(0, 6);
  const { brandCount, listingCount, cityCount } = useMarketplaceStats();

  return (
    <section className="relative z-1 mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-2xl text-center lg:max-w-3xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary sm:text-xs">
          Browse the marketplace
        </p>
        <h2 className="font-display mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-[2.5rem] lg:text-[2.75rem]">
          Explore cars your way
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
          Browse by brand, explore live listings, or compare variants side by side — all powered by the same
          updated catalogue.
        </p>
      </div>

      <div className="mx-auto mt-7 flex max-w-2xl flex-wrap items-center justify-center gap-2 sm:gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 text-xs font-medium text-foreground sm:text-sm">
          <Building2 className="h-3.5 w-3.5 text-primary" aria-hidden />
          {nf(brandCount)} brands
        </span>
        <span className="text-muted-foreground/60" aria-hidden>
          ·
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 text-xs font-medium text-foreground sm:text-sm">
          <ListChecks className="h-3.5 w-3.5 text-primary" aria-hidden />
          {nf(listingCount)} listings
        </span>
        <span className="text-muted-foreground/60" aria-hidden>
          ·
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 text-xs font-medium text-foreground sm:text-sm">
          <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden />
          {nf(cityCount)} cities
        </span>
      </div>

      <div className="mt-10 grid gap-5 sm:gap-6 lg:grid-cols-3 lg:items-stretch">
        {/* Card 1 — Browse by brand */}
        <motion.div
          className="flex h-full min-h-0"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-24px" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href="/brands"
            onClick={() =>
              trackEvent("cta_click", {
                event_category: GA_CATEGORIES.home,
                event_label: "home_marketplace_brands",
                link_href: "/brands",
                section: "browse_marketplace",
              })
            }
            className={cn(
              cardBase,
              "w-full border-border/80 hover:border-primary/30 hover:shadow-md"
            )}
          >
            <EyebrowPill icon={Building2} label="Directory" />
            <h3 className="font-display mt-5 text-xl font-bold tracking-tight text-foreground sm:text-[1.375rem]">
              Browse by brand
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
              Start with trusted makers and jump into models, variants, and live pricing.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2.5">
              {brandPreview.map((b) => (
                <div
                  key={b}
                  className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/80 px-2.5 py-2 transition group-hover:border-primary/25"
                >
                  <BrandLogo
                    brand={b}
                    size={26}
                    className="!rounded-md border-border/70 shadow-sm"
                  />
                  <span className="line-clamp-1 text-[12px] font-semibold text-foreground sm:text-[12.5px]">
                    {b}
                  </span>
                </div>
              ))}
            </div>

            <CardFooter label="Open brand index" kind="default" />
          </Link>
        </motion.div>

        {/* Card 2 — Explore mixed listings (highlighted) */}
        <motion.div
          className="flex h-full min-h-0"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-24px" }}
          transition={{ delay: 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href="/cars/explore"
            onClick={() =>
              trackEvent("cta_click", {
                event_category: GA_CATEGORIES.home,
                event_label: "home_marketplace_explore",
                link_href: "/cars/explore",
                section: "browse_marketplace",
              })
            }
            className={cn(
              cardBase,
              "w-full border-primary/40 ring-1 ring-primary/25 hover:border-primary/60 hover:shadow-[0_18px_44px_-22px_rgba(37,99,235,0.6)]"
            )}
          >
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/15 blur-3xl"
              aria-hidden
            />
            <EyebrowPill icon={Compass} label="Discovery" />
            <h3 className="font-display mt-5 text-xl font-bold tracking-tight text-foreground sm:text-[1.375rem]">
              Explore mixed listings
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
              Search across cars, filters, and cities in a catalogue tuned for browsing.
            </p>

            <div className="relative mt-5 space-y-2.5">
              {[
                { icon: Compass, label: "SUV" },
                { icon: Fuel, label: "Petrol" },
                { icon: IndianRupee, label: "₹8L – ₹12L" },
              ].map((row) => {
                const Icon = row.icon;
                return (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/80 px-3 py-2.5 text-sm font-medium text-foreground"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" aria-hidden />
                      {row.label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                  </div>
                );
              })}

              {/* Featured car preview tile — hidden until we wire a real catalogue thumbnail.
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/80 p-2.5">
                <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Hero
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-[13px] font-semibold text-foreground">
                    Harrier · SUV · Petrol
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                    Live in {nf(cityCount)} cities
                  </p>
                </div>
              </div>
              */}
            </div>

            <CardFooter label="Open explore catalogue" kind="highlighted" />
          </Link>
        </motion.div>

        {/* Card 3 — Compare catalogue variants */}
        <motion.div
          className="flex h-full min-h-0"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-24px" }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href="/compare/catalogue"
            onClick={() =>
              trackEvent("cta_click", {
                event_category: GA_CATEGORIES.home,
                event_label: "home_marketplace_compare",
                link_href: "/compare/catalogue",
                section: "browse_marketplace",
              })
            }
            className={cn(
              cardBase,
              "w-full border-border/80 hover:border-primary/30 hover:shadow-md"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <EyebrowPill icon={BarChart3} label="Compare" />
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                up to 3
              </span>
            </div>
            <h3 className="font-display mt-5 text-xl font-bold tracking-tight text-foreground sm:text-[1.375rem]">
              Compare catalogue variants
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
              Stack up to three variants and compare mileage, features, and price bands in one view.
            </p>

            <div className="mt-5 space-y-2.5">
              {[
                { label: "Mileage", filled: 1 },
                { label: "Features", filled: 1 },
                { label: "Pricing", filled: 3 },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/80 px-3 py-2.5"
                >
                  <span className="text-sm font-medium text-muted-foreground">{row.label}</span>
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => {
                      const active = i < row.filled;
                      return row.label === "Pricing" ? (
                        <span
                          key={i}
                          className={cn(
                            "text-[11px] font-semibold tracking-tight",
                            active ? "text-primary" : "text-muted-foreground/55"
                          )}
                        >
                          {"₹".repeat(i + 1)}
                        </span>
                      ) : (
                        <span
                          key={i}
                          className={cn(
                            "flex h-5 w-8 items-center justify-center rounded-full text-[10px] font-bold",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/70 text-muted-foreground/60"
                          )}
                          aria-hidden
                        >
                          {active ? <Check className="h-3 w-3" /> : "—"}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <CardFooter label="Start catalogue compare" kind="default" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
