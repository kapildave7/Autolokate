"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Flame,
  Layers,
  ListChecks,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RemoteImageWithFallback } from "@/components/ui/remote-image";
import { GA_CATEGORIES, trackEvent } from "@/lib/analytics";
import { hasAuthTokens } from "@/lib/client/auth-storage";
import { getTrending } from "@/lib/client/catalogue-api";
import { cn, formatINR } from "@/lib/utils";

type Props = {
  reduceMotion: boolean;
};

type HeroTrendingItem = {
  id: string;
  href: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  imageAlt: string;
  priceLabel: string;
};

function toHeroTrendingItems(rows: Record<string, unknown>[]): HeroTrendingItem[] {
  return rows.map((row, i) => {
    const slug = String(row.slug ?? "").trim();
    const brand = String(row.brand_name ?? "").trim();
    const model = String(row.model_name ?? row.name ?? "").trim();
    const id = String(row.id ?? slug ?? `trend-${i}`);
    const min = row.min_price ?? row.starting_price ?? row.max_price;
    const max = row.max_price;
    const minN = typeof min === "number" ? min : Number(min);
    const maxN = typeof max === "number" ? max : Number(max);
    let priceLabel = "Price on request";
    if (Number.isFinite(minN) && minN > 0) {
      priceLabel =
        Number.isFinite(maxN) && maxN > minN
          ? `${formatINR(minN)} – ${formatINR(maxN)}`
          : `From ${formatINR(minN)}`;
    }
    const hero = String(
      row.hero_image_url ?? row.image_url ?? row.thumbnail_url ?? ""
    ).trim();
    const fuel =
      row.fuel_type ?? (Array.isArray(row.fuel_types) ? (row.fuel_types as string[])[0] : "");
    const body = row.body_type;
    const subtitle = [body, fuel].filter(Boolean).join(" · ") || "Catalogue model";
    const display = model || [brand, model].filter(Boolean).join(" ");
    return {
      id,
      href: slug ? `/cars/${encodeURIComponent(slug)}` : "/cars",
      title: display || "Model",
      subtitle,
      imageUrl: hero || null,
      imageAlt: `${brand} ${model}`.trim() || display || "Model",
      priceLabel,
    };
  });
}

function TrendingModelsCard({ reduceMotion }: { reduceMotion: boolean }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["catalogue-trending"],
    queryFn: () => getTrending(),
    staleTime: 5 * 60_000,
  });

  const items = useMemo(
    () => (data?.length ? toHeroTrendingItems(data).slice(0, 3) : []),
    [data]
  );

  if (isError) return null;

  return (
    <motion.aside
      initial={reduceMotion ? undefined : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Trending models in the catalogue"
      className="relative w-full overflow-hidden rounded-3xl border border-border/80 bg-card/95 p-5 shadow-hero-card ring-1 ring-foreground/[0.04] backdrop-blur-md sm:p-6"
    >
      <div
        className="pointer-events-none absolute -right-12 -top-14 h-32 w-32 rounded-full bg-primary/10 blur-2xl"
        aria-hidden
      />
      <div className="relative mb-4 flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          Trending Models
        </h3>
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/15"
          aria-hidden
        >
          <Flame className="h-3.5 w-3.5" />
        </span>
      </div>

      <ul className="relative space-y-2.5">
        {isPending
          ? [0, 1, 2].map((k) => (
              <li
                key={k}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 p-2.5"
              >
                <div className="h-14 w-20 shrink-0 animate-pulse rounded-xl bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                </div>
              </li>
            ))
          : items.length === 0
            ? (
                <li className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                  Trending list is refreshing…
                </li>
              )
            : items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() =>
                      trackEvent("hero_trending_model_click", {
                        event_category: GA_CATEGORIES.home,
                        model_id: item.id,
                      })
                    }
                    className={cn(
                      "group flex items-center gap-3 rounded-2xl border border-border/60 bg-background/40 p-2.5 transition",
                      "hover:-translate-y-0.5 hover:border-primary/35 hover:bg-background hover:shadow-md"
                    )}
                  >
                    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                      <RemoteImageWithFallback
                        src={item.imageUrl ?? ""}
                        alt={item.imageAlt}
                        fill
                        sizes="80px"
                        className="object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold text-foreground sm:text-[0.95rem]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] uppercase tracking-wide text-muted-foreground sm:text-[12px]">
                        {item.subtitle}
                      </p>
                      <p className="mt-1 line-clamp-1 text-[12px] font-medium tabular-nums text-foreground/85 sm:text-[13px]">
                        {item.priceLabel}
                      </p>
                    </div>
                    <ChevronRight
                      className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
      </ul>

      <div className="relative mt-4 border-t border-border/70 pt-3">
        <Link
          href="/cars"
          onClick={() =>
            trackEvent("hero_view_all_models_click", { event_category: GA_CATEGORIES.home })
          }
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition hover:gap-2"
        >
          <BookOpen className="h-4 w-4" aria-hidden />
          View all models
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </motion.aside>
  );
}

const HERO_FEATURES = [
  {
    title: "Live catalogue",
    body: "Latest models & variants",
    icon: Layers,
  },
  {
    title: "Verified specs",
    body: "Accurate & up to date",
    icon: ShieldCheck,
  },
  {
    title: "Smart shortlist",
    body: "Save, compare, decide",
    icon: ListChecks,
  },
] as const;

/** Home hero — theme-aware showroom backdrop with copy + CTAs and a trending-models teaser card. */
export function HomeHeroSection({ reduceMotion }: Props) {
  const router = useRouter();
  const loggedIn = useSyncExternalStore(
    () => () => {},
    () => hasAuthTokens(),
    () => false
  );

  const recsLabel = "Get Recommendations";

  const onLoggedInRecommendations = () => {
    trackEvent("hero_get_recommendations_click", {
      event_category: GA_CATEGORIES.home,
      auth_state: "logged_in",
    });
    const el = document.getElementById("ai-matched-results");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else router.push("/cars");
  };

  const trackLoginRedirect = () => {
    trackEvent("hero_get_recommendations_click", {
      event_category: GA_CATEGORIES.home,
      auth_state: "logged_out",
    });
  };

  return (
    <section className="relative isolate overflow-hidden border-b border-border/70 bg-background">
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/images/home_banner_light.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="theme-light-only object-cover object-[78%_center] lg:object-[68%_center]"
          aria-hidden
        />
        <Image
          src="/images/home_banner_dark.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="theme-dark-only object-cover object-[78%_center] lg:object-[68%_center]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-linear-to-r from-background via-background/85 to-background/0 lg:via-background/65"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-background/80 to-transparent"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-background to-transparent"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-12 lg:items-center lg:gap-10 lg:px-8 lg:py-24">
        <motion.div
          className="min-w-0 lg:col-span-7"
          initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Smart Car Finder
          </span>

          <h1 className="font-display mt-6 max-w-xl text-balance text-[2.25rem] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-[2.75rem] lg:text-[3.25rem] xl:text-[3.5rem]">
            Find the right car with{" "}
            <span className="text-primary">confidence.</span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-[1.05rem]">
            Compare models, explore variants, and get smart recommendations based on your budget,
            fuel type, and lifestyle.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" variant="primary" className="px-7">
              <Link
                href="/cars"
                onClick={() =>
                  trackEvent("hero_explore_cars_click", { event_category: GA_CATEGORIES.home })
                }
              >
                <Sparkles className="h-4 w-4" aria-hidden />
                Explore Cars
              </Link>
            </Button>
            {loggedIn ? (
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="border-border/80 bg-background/70 px-7 backdrop-blur-md hover:bg-background"
                onClick={onLoggedInRecommendations}
              >
                {recsLabel}
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-border/80 bg-background/70 px-7 backdrop-blur-md hover:bg-background"
              >
                <Link href="/login?next=%2F" onClick={trackLoginRedirect}>
                  {recsLabel}
                </Link>
              </Button>
            )}
          </div>

          <ul className="mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {HERO_FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <li
                  key={f.title}
                  className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/70 p-3.5 backdrop-blur-sm transition hover:border-primary/35 hover:bg-card"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15"
                    aria-hidden
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground sm:text-sm">
                      {f.title}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground sm:text-[12.5px]">
                      {f.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </motion.div>

        <div className="w-full lg:col-span-5 lg:max-w-md lg:justify-self-end">
          <TrendingModelsCard reduceMotion={reduceMotion} />
        </div>
      </div>
    </section>
  );
}

export { HomeHeroSection as HeroContainer };
