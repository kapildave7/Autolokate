"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Bike, CarFront, CircleDot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { curatedBrands, curatedBrandSlug, getBrandInsight } from "@/lib/brands-curated";
import { BrandLogo } from "@/components/brands/brand-logo";

const tabs = [
  { key: "all", label: "All", icon: CircleDot },
  { key: "cars", label: "Cars", icon: CarFront },
  { key: "motorcycles", label: "Motorcycles", icon: Bike },
  { key: "scooters", label: "Scooters", icon: Bike },
] as const;

export function VehicleBrandShowcase() {
  const [active, setActive] = useState<(typeof tabs)[number]["key"]>("all");

  const rows = useMemo(() => {
    return curatedBrands.filter((b) => active === "all" || b.kind === active);
  }, [active]);

  return (
    <section className="bg-premium-aurora border-b border-border py-12 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Brands and models</p>
            <h2 className="font-display mt-2 text-3xl text-foreground sm:text-4xl">
              Explore every important car and bike brand
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Research model specs, colors, variants, videos, and comparisons with SEO-friendly pages built for
              discovery.
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link href="/cars">
              Browse full inventory
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-7 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const activeTab = active === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActive(tab.key)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                  activeTab
                    ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "border-border bg-white text-foreground hover:border-primary/35"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white/90 p-3">
          <div className="flex w-max min-w-full items-center gap-3">
            {rows.map((brand) => (
              <Link key={`wm-${brand.name}`} href={`/brands/${curatedBrandSlug(brand.name)}`} className="shrink-0">
                <BrandLogo brand={brand.name} size={28} variant="wordmark" className="shadow-sm transition hover:border-primary/35" />
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((brand, index) => {
            const href = `/brands/${curatedBrandSlug(brand.name)}`;
            return (
              <motion.div
                key={brand.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: Math.min(index, 8) * 0.03 }}
              >
                <Link href={href}>
                  <Card className="group card-hover-premium h-full border-border bg-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <BrandLogo brand={brand.name} size={30} variant="wordmark" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{brand.name}</p>
                          <p className="text-xs capitalize text-muted-foreground">{brand.kind}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{getBrandInsight(brand.name, brand.kind)}</span>
                        <span className="font-semibold text-primary opacity-0 transition group-hover:opacity-100">
                          Explore
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card className="border-border/90 bg-white/90">
            <CardContent className="space-y-2 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Related card</p>
              <p className="text-sm font-semibold text-foreground">Brand-wise model pages</p>
              <p className="text-xs text-muted-foreground">SEO routes grouped by maker, model, and variant details.</p>
              <Link className="inline-flex text-xs font-semibold text-primary hover:underline" href="/cars">
                Open all model pages
              </Link>
            </CardContent>
          </Card>
          <Card className="border-border/90 bg-white/90">
            <CardContent className="space-y-2 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Related card</p>
              <p className="text-sm font-semibold text-foreground">Video and editorial media</p>
              <p className="text-xs text-muted-foreground">Review videos, comparisons, and deep automotive guides.</p>
              <Link className="inline-flex text-xs font-semibold text-primary hover:underline" href="/media">
                Go to media house
              </Link>
            </CardContent>
          </Card>
          <Card className="border-border/90 bg-white/90">
            <CardContent className="space-y-2 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Related card</p>
              <p className="text-sm font-semibold text-foreground">Spec and color comparison</p>
              <p className="text-xs text-muted-foreground">Compare trims, colors, and value before shortlisting.</p>
              <Link className="inline-flex text-xs font-semibold text-primary hover:underline" href="/compare">
                Start compare
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
