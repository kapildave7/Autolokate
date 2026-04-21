"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Building2, LayoutGrid, Search } from "lucide-react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { getBrandModels, getBrands } from "@/lib/client/catalogue-api";
import { slugifyPart } from "@/lib/seo/slugs";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { BrandLogo } from "@/components/brands/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageFade } from "@/components/shared/page-fade";

type BrandRow = { name?: string; brand_name?: string; slug?: string };
type BrandCard = { name: string; slug: string };

export function BrandsDirectoryPage() {
  const reduceMotion = useReducedMotion();
  const [brandQuery, setBrandQuery] = useState("");
  const { data: brandsResponse } = useQuery({
    queryKey: ["catalogue-brands"],
    queryFn: () => getBrands(),
  });
  const brands = useMemo(() => {
    const cards = ((brandsResponse ?? []) as BrandRow[])
      .map((brand) => {
        const name = String(brand.name ?? brand.brand_name ?? "").trim();
        const slug = String(brand.slug ?? slugifyPart(name)).trim();
        if (!name || !slug) return null;
        return { name, slug };
      })
      .filter((row): row is BrandCard => Boolean(row));

    const deduped = new Map<string, BrandCard>();
    for (const card of cards) {
      const key = card.slug.toLowerCase();
      if (!deduped.has(key)) deduped.set(key, card);
    }
    return [...deduped.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  }, [brandsResponse]);

  const filteredBrands = useMemo(() => {
    const q = brandQuery.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, brandQuery]);
  const modelCountQueries = useQueries({
    queries: brands.map((brand) => ({
      queryKey: ["catalogue-brand-model-count", brand.slug],
      queryFn: async () => {
        const rows = await getBrandModels(brand.slug);
        return rows.length;
      },
      staleTime: 5 * 60_000,
    })),
  });
  const countsByBrandSlug = useMemo(
    () =>
      Object.fromEntries(
        brands.map((brand, idx) => [
          brand.slug.toLowerCase(),
          typeof modelCountQueries[idx]?.data === "number" ? (modelCountQueries[idx].data as number) : 0,
        ])
      ),
    [brands, modelCountQueries]
  );

  return (
    <PageFade>
      <section className="relative overflow-hidden border-b border-border bg-background">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(ellipse 120% 80% at 100% -10%, rgba(39,39,42,0.1), transparent 55%),
              radial-gradient(ellipse 90% 70% at 0% 100%, rgba(63,63,70,0.08), transparent 50%),
              linear-gradient(180deg, hsl(var(--secondary) / 0.35) 0%, hsl(var(--background)) 100%)`,
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              <Building2 className="h-3.5 w-3.5" aria-hidden />
              Marketplace
            </p>
            <h1 className="font-display mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[2.75rem]">
              Explore by brand
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Official manufacturer marks on a neutral canvas for maximum clarity. Select a brand to open filtered
              inventory — price, fuel, body type, city, and more.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button variant="default" size="lg" className="gap-2 rounded-full px-6" asChild>
                <Link href="/cars/explore">
                  <LayoutGrid className="h-4 w-4" />
                  Explore all cars
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="rounded-full border-primary/20 px-6 shadow-sm" asChild>
                <Link href="/cars">
                  Full inventory
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="relative border-b border-border/60 bg-linear-to-b from-background via-secondary/20 to-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <div className="mx-auto mb-8 max-w-xl">
            <label className="mb-2 block text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Find a brand
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={brandQuery}
                onChange={(e) => setBrandQuery(e.target.value)}
                placeholder="Type to filter brands…"
                className="h-11 rounded-xl pl-9 shadow-sm"
                aria-label="Filter brands by name"
              />
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-semibold tabular-nums text-foreground">{filteredBrands.length}</span> of{" "}
              <span className="tabular-nums">{brands.length}</span> brands
            </p>
          </div>
          {filteredBrands.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center">
              <p className="font-medium text-foreground">No brands match “{brandQuery.trim()}”</p>
              <Button type="button" variant="link" className="mt-2 h-auto p-0 text-primary" onClick={() => setBrandQuery("")}>
                Clear search
              </Button>
            </div>
          ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
            {filteredBrands.map((brand, i) => {
              const n = countsByBrandSlug[brand.slug.toLowerCase()] ?? 0;
              return (
                <motion.li
                  key={brand.slug}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{ delay: Math.min(i * 0.025, 0.45), duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={`/cars/brand/${brand.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card p-1 shadow-[0_4px_24px_-12px_rgba(15,23,42,0.1)] ring-1 ring-foreground/[0.04] transition duration-300 hover:-translate-y-1 hover:border-foreground/12 hover:shadow-[0_24px_48px_-28px_rgba(24,24,27,0.14)]"
                  >
                    <div className="flex min-h-[8.5rem] w-full items-center justify-center rounded-xl bg-linear-to-b from-white to-secondary/40 px-4 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-border/50 dark:from-zinc-100 dark:to-zinc-200/95">
                      <BrandLogo brand={brand.name} size={76} className="rounded-xl border-0 bg-transparent shadow-none" />
                    </div>
                    <div className="flex flex-1 flex-col px-3 pb-4 pt-3 text-center sm:px-4 sm:pb-5 sm:pt-4">
                      <span className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-foreground sm:text-[0.9375rem]">
                        {brand.name}
                      </span>
                      <span className="mt-1 text-[11px] font-medium tabular-nums text-muted-foreground">
                        {n.toLocaleString("en-IN")} model{n === 1 ? "" : "s"} in catalogue
                      </span>
                      <span className="mt-3 inline-flex items-center justify-center gap-1 text-xs font-semibold text-primary opacity-80 transition group-hover:opacity-100">
                        View inventory
                        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                </motion.li>
              );
            })}
          </ul>
          )}
        </div>
      </div>
    </PageFade>
  );
}
