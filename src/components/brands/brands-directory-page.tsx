"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Info, LayoutGrid, Search } from "lucide-react";
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
    return [...deduped.values()].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
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
          typeof modelCountQueries[idx]?.data === "number"
            ? (modelCountQueries[idx].data as number)
            : 0,
        ])
      ),
    [brands, modelCountQueries]
  );

  return (
    <PageFade>
      {/* ── Hero Banner ── */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Light-mode background */}
        <Image
          src="/brand_bg_light.png"
          alt=""
          fill
          priority
          className="object-cover object-center dark:hidden"
          sizes="100vw"
          aria-hidden
        />
        {/* Dark-mode background */}
        <Image
          src="/brand_bg_dark.png"
          alt=""
          fill
          priority
          className="hidden object-cover object-center dark:block"
          sizes="100vw"
          aria-hidden
        />
        {/* readability overlay */}
        <div
          className="pointer-events-none absolute inset-0 bg-white/55 dark:bg-[#030d1e]/65"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <p className="inline-flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              <Building2 className="h-3.5 w-3.5" aria-hidden />
              Marketplace
            </p>
            <h1 className="font-display mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-tight">
              Explore by{" "}
              <span className="text-primary underline decoration-primary/40 decoration-2 underline-offset-4">
                brand
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-foreground/70 sm:text-base">
              Official manufacturer marks on a neutral canvas for maximum clarity.
              Select a brand to open filtered inventory — price, fuel, body type, city, and more.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="default"
                size="lg"
                className="gap-2 rounded-full bg-primary px-7 font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90"
                asChild
              >
                <Link href="/cars/explore">
                  <LayoutGrid className="h-4 w-4" />
                  Explore all cars
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full border-foreground/25 bg-transparent px-7 font-semibold backdrop-blur-sm hover:bg-foreground/5 dark:border-white/20 dark:text-white dark:hover:bg-white/5"
                asChild
              >
                <Link href="/cars">
                  Full inventory
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Brand Finder ── */}
      <div className="bg-background">
        <div className="mx-auto max-w-5xl px-4 pt-14 pb-24 sm:px-6 lg:px-8">
          {/* Search */}
          <div className="mx-auto mb-10 max-w-lg">
            <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Find a brand
            </p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={brandQuery}
                onChange={(e) => setBrandQuery(e.target.value)}
                placeholder="Type to filter brands..."
                className="h-12 rounded-2xl border-border/60 bg-card pl-11 text-sm shadow-sm ring-1 ring-border/40 placeholder:text-muted-foreground/60 focus-visible:ring-primary/50"
                aria-label="Filter brands by name"
              />
            </div>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                Showing{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {filteredBrands.length}
                </span>{" "}
                {filteredBrands.length === brands.length
                  ? "brands"
                  : `of ${brands.length} brands`}
              </span>
            </div>
          </div>

          {/* Cards */}
          {filteredBrands.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
              <p className="font-medium text-foreground">
                No brands match &ldquo;{brandQuery.trim()}&rdquo;
              </p>
              <Button
                type="button"
                variant="link"
                className="mt-2 h-auto p-0 text-primary"
                onClick={() => setBrandQuery("")}
              >
                Clear search
              </Button>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
              {filteredBrands.map((brand, i) => {
                const n = countsByBrandSlug[brand.slug.toLowerCase()] ?? 0;
                return (
                  <motion.li
                    key={brand.slug}
                    initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-20px" }}
                    transition={{
                      delay: Math.min(i * 0.05, 0.45),
                      duration: 0.4,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Link
                      href={`/cars/brand/${brand.slug}`}
                      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_8px_30px_-8px_rgba(59,130,246,0.22)] dark:hover:shadow-[0_8px_40px_-8px_rgba(59,130,246,0.28)]"
                    >
                      {/* Logo area — always white */}
                      <div className="flex items-center justify-center bg-white px-8 py-10">
                        <BrandLogo
                          brand={brand.name}
                          size={92}
                          className="rounded-xl border-0 bg-transparent shadow-none"
                        />
                      </div>

                      {/* Wave separator */}
                      <div className="relative -mt-px h-8 w-full overflow-hidden">
                        <svg
                          viewBox="0 0 400 32"
                          preserveAspectRatio="none"
                          className="absolute inset-0 h-full w-full"
                          aria-hidden
                        >
                          <path d="M0,16 C80,32 320,0 400,16 L400,0 L0,0 Z" fill="white" />
                          <path
                            d="M0,16 C80,32 320,0 400,16 L400,32 L0,32 Z"
                            className="fill-card"
                          />
                        </svg>
                      </div>

                      {/* Info area */}
                      <div className="relative flex flex-1 flex-col items-center px-6 pb-6 pt-1 text-center">
                        {/* decorative dot grid */}
                        <div
                          className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.07]"
                          style={{
                            backgroundImage:
                              "radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)",
                            backgroundSize: "16px 16px",
                          }}
                          aria-hidden
                        />
                        <span className="relative text-base font-bold text-foreground">
                          {brand.name}
                        </span>
                        <span className="relative mt-1 text-xs font-medium tabular-nums text-muted-foreground">
                          {n.toLocaleString("en-IN")} model{n === 1 ? "" : "s"} in catalogue
                        </span>
                        <span className="relative mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 py-2.5 text-xs font-semibold text-primary transition-colors group-hover:bg-primary/10 dark:border-primary/25 dark:bg-primary/10">
                          View inventory
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
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
