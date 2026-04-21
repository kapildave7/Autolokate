"use client";

import { RemoteImageWithFallback } from "@/components/ui/remote-image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, GitCompare, Heart, MapPin, Play, ZoomIn } from "lucide-react";
import { useEffect, useState } from "react";
import { CarDetailPremiumSections } from "@/components/cars/car-detail-premium-sections";
import { useRecentlyViewedStore } from "@/stores/recently-viewed-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Car } from "@/data/types";
import { articles, cars, companies } from "@/data";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { exteriorFallbackForKey } from "@/lib/fallback-images";
import { cn, formatINR } from "@/lib/utils";
import { SeoBreadcrumbs } from "@/components/seo/breadcrumbs";
import { CarListingImageBadges } from "@/components/cars/car-listing-image-badges";
import { useCompareStore } from "@/stores/compare-store";
import { useSavedStore } from "@/stores/saved-store";
import { FEATURE_FLAGS } from "@/lib/features";
import { GA_CATEGORIES, trackEvent } from "@/lib/analytics";
import { IndianDriveGuidePlayer } from "@/components/indian-drive-guide/indian-drive-guide-player";
import {
  IDG_FEATURE_COPY,
  IDG_HOME_VIDEOS,
  INDIAN_DRIVE_GUIDE_CHANNEL_URL,
} from "@/lib/indian-drive-guide-youtube";
import { toast } from "sonner";
import { ExpertConsultationSection } from "@/components/shared/expert-consultation-section";
import { CarDetailAiAssistant } from "@/components/cars/car-detail-ai-assistant";
import { resolveListingCarToVariantId } from "@/lib/compare-listing-resolve";
import { CarDetailExploreSections } from "@/components/cars/car-detail-explore-sections";

const sectionLabel = "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";
const linkAccent = "font-medium text-primary underline-offset-4 hover:text-primary/85 hover:underline";

export function CarDetailView({ car }: { car: Car }) {
  const company = companies.find((c) => c.id === car.companyId);
  const companySlug = company?.slug ?? "spin-city-motors";
  const addVariant = useCompareStore((s) => s.addVariant);
  const removeByListingId = useCompareStore((s) => s.removeByListingId);
  const compareHas = useCompareStore((s) => s.hasListing(car.id));
  const compareTrayCount = useCompareStore((s) => s.variantIds.length);
  const toggleSaved = useSavedStore((s) => s.toggle);
  const savedStore = useSavedStore((s) => s.has(car.id));
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const saved = mounted && savedStore;

  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [compareBusy, setCompareBusy] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setHeroLoaded(false);
  }, [idx, car.id]);

  useEffect(() => {
    const t = window.setTimeout(() => setHeroLoaded(true), 2800);
    return () => window.clearTimeout(t);
  }, [idx, car.id]);
  const pushViewed = useRecentlyViewedStore((s) => s.push);

  useEffect(() => {
    pushViewed(car.id);
  }, [car.id, pushViewed]);

  const editorialPicks = articles
    .filter((a) => a.tags?.includes(car.brand) || a.tags?.includes(car.city))
    .slice(0, 3);
  const modelFamily = cars.filter((x) => x.brand === car.brand && x.model === car.model);
  const availableColors = [...new Set(modelFamily.map((x) => x.exteriorColor))];
  const modelVariants = modelFamily.slice(0, 8);
  const [variantA, setVariantA] = useState(modelVariants[0]?.id ?? "");
  const [variantB, setVariantB] = useState(modelVariants[1]?.id ?? modelVariants[0]?.id ?? "");
  const selectedVariantA = modelVariants.find((v) => v.id === variantA) ?? modelVariants[0];
  const selectedVariantB = modelVariants.find((v) => v.id === variantB) ?? modelVariants[1] ?? modelVariants[0];
  const coreSpecs: Record<string, string> = {
    Engine: car.engine,
    Power: car.power,
    Torque: car.torque,
    Mileage: car.mileage,
    "Fuel type": car.fuel,
    Transmission: car.transmission,
  };

  const galleryCount = Math.max(car.images.length, 1);
  const listingPhotoAlt = (photoIndex: number) =>
    `${car.brand} ${car.model} ${car.year} in ${car.city} — listing photo ${photoIndex + 1} of ${galleryCount}`;

  return (
    <div
      className={cn(
        "relative min-h-screen min-w-0 overflow-x-clip bg-background pt-6 sm:pt-8",
        compareTrayCount > 0 ? "pb-40 sm:pb-36 lg:pb-32" : "pb-24 sm:pb-20 lg:pb-10"
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(420px,55vh)] bg-[radial-gradient(ellipse_90%_55%_at_100%_-8%,rgba(63,63,70,0.08),transparent_52%),radial-gradient(ellipse_70%_48%_at_0%_100%,rgba(15,10,20,0.04),transparent_48%)]"
        aria-hidden
      />
      <div className="relative mx-auto w-full min-w-0 max-w-7xl px-4 sm:px-6 lg:px-8">
      <SeoBreadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Browse", href: "/cars" },
          { name: car.brand },
          { name: `${car.model} · ${car.year}` },
        ]}
      />

      <div className="mt-6 grid min-w-0 gap-5 lg:mt-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:items-stretch lg:gap-8">
        <div className="flex min-h-0 min-w-0 flex-col gap-3 lg:h-full">
          <motion.div
            layout
            className="relative aspect-16/10 cursor-zoom-in overflow-hidden rounded-2xl border border-border bg-muted/40 shadow-md ring-1 ring-border/60 transition-all duration-500 ease-out hover:shadow-xl hover:ring-2 hover:ring-primary/20 motion-reduce:transition-none"
            onClick={() => setZoom(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setZoom(true)}
            aria-label="Enlarge photo"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${car.id}-${idx}`}
                initial={{ opacity: 0, x: reduceMotion ? 0 : 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: reduceMotion ? 0 : -14 }}
                transition={{ duration: reduceMotion ? 0.15 : 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <RemoteImageWithFallback
                  src={car.images[idx] ?? exteriorFallbackForKey(car.id)}
                  alt={listingPhotoAlt(idx)}
                  fill
                  className={cn(
                    "object-cover transition-[opacity,transform] duration-500 ease-out",
                    heroLoaded ? "scale-100 opacity-100" : "scale-[1.02] opacity-90 motion-reduce:scale-100 motion-reduce:opacity-100"
                  )}
                  priority
                  sizes="(max-width:1024px) 100vw, 65vw"
                  onLoadingComplete={() => setHeroLoaded(true)}
                />
              </motion.div>
            </AnimatePresence>
            <div className="absolute left-4 top-4 z-1">
              <CarListingImageBadges car={car} />
            </div>
            <span className="pointer-events-none absolute bottom-4 left-4 inline-flex items-center gap-1 rounded-lg bg-foreground/80 px-2 py-1 text-[10px] font-medium text-background">
              <ZoomIn className="h-3 w-3" />
              Tap to zoom
            </span>
          </motion.div>

          <Dialog open={zoom} onOpenChange={setZoom}>
            <DialogContent className="max-h-[95dvh] w-[min(100vw-1rem,56rem)] max-w-[calc(100vw-1rem)] border-border bg-card p-2 sm:max-w-[95vw] sm:p-4">
              <div className="relative aspect-video w-full min-w-0 max-w-5xl">
                <RemoteImageWithFallback
                  src={car.images[idx] ?? exteriorFallbackForKey(car.id)}
                  alt={listingPhotoAlt(idx)}
                  fill
                  className="object-contain"
                  sizes="95vw"
                  priority
                />
              </div>
            </DialogContent>
          </Dialog>
          <div className="mt-3 flex touch-pan-x gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:thin] snap-x snap-mandatory sm:snap-none">
            {car.images.map((src, i) => (
              <button
                key={`${car.id}-thumb-${i}`}
                type="button"
                onClick={() => setIdx(i)}
                className={`relative h-16 w-24 shrink-0 snap-start overflow-hidden rounded-xl border-2 transition-all duration-300 ease-out motion-reduce:transition-none ${
                  i === idx
                    ? "border-primary shadow-md ring-2 ring-primary/30"
                    : "border-transparent opacity-70 hover:scale-[1.04] hover:border-primary/20 hover:opacity-100 hover:shadow-md"
                }`}
              >
                <RemoteImageWithFallback
                  src={src}
                  alt={listingPhotoAlt(i)}
                  fill
                  className="object-cover"
                  sizes="96px"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </button>
            ))}
          </div>

          <Card className="overflow-hidden border-border/80 bg-card shadow-md ring-1 ring-primary/5 transition-shadow duration-300 hover:shadow-lg motion-reduce:transition-none">
            <CardContent className="divide-y divide-border/80 p-0">
              <div className="bg-linear-to-r from-muted/40 to-transparent p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner ring-1 ring-primary/15 transition-transform duration-200 hover:scale-105">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className={sectionLabel}>Listing location</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">{car.city}</p>
                  </div>
                </div>
              </div>
              <div className="bg-linear-to-r from-muted/35 to-transparent p-4 pb-3 sm:p-5 sm:pb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary shadow-inner ring-1 ring-primary/10 transition-transform duration-200 hover:scale-105">
                      <Play className="h-5 w-5 fill-current" />
                    </div>
                    <div className="min-w-0">
                      <p className={sectionLabel}>Indian Drive Guide</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">Driving context for Indian roads</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{IDG_FEATURE_COPY.shortLine}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-9 w-full shrink-0 border-border sm:w-auto" asChild>
                    <Link href={INDIAN_DRIVE_GUIDE_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                      Open channel
                    </Link>
                  </Button>
                </div>
                <IndianDriveGuidePlayer
                  videoId={IDG_HOME_VIDEOS.clipSafetyA}
                  title={`Indian Drive Guide — ${car.brand} ${car.model} context`}
                  autoplayWhenVisible
                  layout="compact"
                  className="mt-2.5 w-full shrink-0"
                />
              </div>
            </CardContent>
          </Card>

          <ExpertConsultationSection
            className="mt-auto"
            placement="car-detail"
            vehicleLabel={`${car.brand} ${car.model}`}
            trackSource="car_detail_expert_section"
          />
        </div>

        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start lg:h-fit">
          <div className="space-y-4 rounded-2xl border border-border/80 bg-card/95 p-4 shadow-lg shadow-primary/[0.04] ring-1 ring-primary/8 backdrop-blur-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/[0.06] sm:p-5 md:p-6 motion-reduce:transition-none">
          <div className="min-w-0">
            <p className={sectionLabel}>Vehicle profile</p>
            <h1 className="font-display mt-1.5 break-words text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {car.brand} {car.model}
            </h1>
            <p className="mt-1.5 break-words text-sm text-muted-foreground">{car.variant}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge variant="outline" className="rounded-lg border-border/80 transition-colors duration-200 hover:border-primary/35 hover:bg-primary/5">
                {car.bodyType}
              </Badge>
              <Badge variant="outline" className="rounded-lg border-border/80 transition-colors duration-200 hover:border-primary/35 hover:bg-primary/5">
                {car.transmission}
              </Badge>
              <Badge variant="outline" className="rounded-lg border-border/80 transition-colors duration-200 hover:border-primary/35 hover:bg-primary/5">
                {car.fuel}
              </Badge>
              <Badge variant="secondary" className="rounded-lg transition-transform duration-200 hover:scale-[1.02] motion-reduce:hover:scale-100">
                {car.exteriorColor}
              </Badge>
              <Badge variant="outline" className="rounded-lg border-border/80 transition-colors duration-200 hover:border-primary/35 hover:bg-primary/5">
                {car.sellerType}
              </Badge>
            </div>
          </div>

          <div className="flex items-start justify-between gap-3 rounded-xl border border-primary/15 bg-linear-to-br from-primary/[0.09] via-muted/20 to-transparent p-3.5 shadow-inner sm:items-end sm:gap-4 sm:p-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Listed reference price
              </p>
              {car.discountPercent > 0 ? (
                <p className="text-sm text-muted-foreground line-through">{formatINR(car.listPrice)}</p>
              ) : null}
              <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl">
                {formatINR(car.price)}
              </p>
              {car.discountPercent > 0 ? (
                <p className="text-xs font-semibold text-primary">{car.discountPercent}% off list</p>
              ) : null}
              <p className="mt-0.5 text-pretty text-xs leading-snug text-muted-foreground">
                Reference EMI ~{formatINR(car.estimatedEmiMonthly)}/mo (illustrative, from listing data)
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                toggleSaved(car.id);
                trackEvent("car_save_toggle", {
                  event_category: GA_CATEGORIES.car_detail,
                  car_id: car.id,
                  saved: !saved,
                });
              }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-all duration-200 hover:scale-105 hover:border-primary/40 hover:text-primary hover:shadow-md active:scale-95 motion-reduce:hover:scale-100"
              aria-label="Save"
            >
              <Heart className={saved ? "h-5 w-5 fill-primary text-primary" : "h-5 w-5"} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {(
              [
                { label: "Year", value: String(car.year) },
                { label: "Odometer", value: `${car.kms.toLocaleString("en-IN")} km` },
                { label: "Owners", value: car.owners },
                { label: "City", value: car.city },
              ] as const
            ).map((cell) => (
              <div
                key={cell.label}
                className="min-w-0 rounded-xl border border-border/70 bg-muted/25 p-3 transition-all duration-200 hover:border-primary/25 hover:bg-primary/[0.04] hover:shadow-sm motion-reduce:transition-none"
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{cell.label}</p>
                <p className="mt-0.5 break-words font-semibold tabular-nums text-foreground">{cell.value}</p>
              </div>
            ))}
          </div>
          <Card className="border-border bg-card shadow-none">
            <CardContent className="space-y-2 p-3 sm:p-4">
              <p className="text-sm font-semibold text-foreground">Available colors</p>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((c) => (
                  <Badge
                    key={c}
                    variant="outline"
                    className={
                      c === car.exteriorColor
                        ? "border-primary bg-primary/10 font-medium text-foreground"
                        : "border-border"
                    }
                  >
                    {c}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-none">
            <CardContent className="space-y-2 p-3 sm:p-4">
              <p className="text-sm font-semibold text-foreground">Variant line-up</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {modelVariants.map((v) => (
                  <div key={v.id} className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">{v.variant}</p>
                    <p>{formatINR(v.price)} · {v.transmission}</p>
                  </div>
                ))}
              </div>
              {modelVariants.length >= 2 ? (
                <div className="mt-2 space-y-3 rounded-xl border border-border bg-secondary/20 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Side-by-side variant compare</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <select
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                      value={variantA}
                      onChange={(e) => {
                        setVariantA(e.target.value);
                        trackEvent("variant_compare_select", {
                          event_category: GA_CATEGORIES.car_detail,
                          side: "left",
                          variant_id: e.target.value,
                          car_id: car.id,
                        });
                      }}
                    >
                      {modelVariants.map((v) => (
                        <option key={`left-${v.id}`} value={v.id}>
                          {v.variant}
                        </option>
                      ))}
                    </select>
                    <select
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                      value={variantB}
                      onChange={(e) => {
                        setVariantB(e.target.value);
                        trackEvent("variant_compare_select", {
                          event_category: GA_CATEGORIES.car_detail,
                          side: "right",
                          variant_id: e.target.value,
                          car_id: car.id,
                        });
                      }}
                    >
                      {modelVariants.map((v) => (
                        <option key={`right-${v.id}`} value={v.id}>
                          {v.variant}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="max-w-full min-w-0 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
                    <table className="w-full min-w-[18rem] text-sm sm:min-w-[26rem]">
                      <thead>
                        <tr className="text-left text-xs text-muted-foreground">
                          <th className="py-2">Metric</th>
                          <th className="py-2">{selectedVariantA?.variant ?? "-"}</th>
                          <th className="py-2">{selectedVariantB?.variant ?? "-"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-border">
                          <td className="py-2">Price</td>
                          <td className="py-2 font-medium">{selectedVariantA ? formatINR(selectedVariantA.price) : "-"}</td>
                          <td className="py-2 font-medium">{selectedVariantB ? formatINR(selectedVariantB.price) : "-"}</td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="py-2">Transmission</td>
                          <td className="py-2">{selectedVariantA?.transmission ?? "-"}</td>
                          <td className="py-2">{selectedVariantB?.transmission ?? "-"}</td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="py-2">Fuel</td>
                          <td className="py-2">{selectedVariantA?.fuel ?? "-"}</td>
                          <td className="py-2">{selectedVariantB?.fuel ?? "-"}</td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="py-2">Mileage</td>
                          <td className="py-2">{selectedVariantA?.mileage ?? "-"}</td>
                          <td className="py-2">{selectedVariantB?.mileage ?? "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
            <Button
              variant="outline"
              type="button"
              className={cn(
                "h-10 justify-center gap-2 sm:min-w-42",
                compareHas && "border-primary/45 bg-primary/10 text-foreground hover:bg-primary/[0.14]"
              )}
              disabled={compareBusy}
              onClick={() => {
                if (compareHas) {
                  removeByListingId(car.id);
                  trackEvent("compare_action", {
                    event_category: GA_CATEGORIES.compare,
                    car_id: car.id,
                    source: "detail",
                    action: "remove",
                  });
                  return;
                }
                setCompareBusy(true);
                void (async () => {
                  const vid = await resolveListingCarToVariantId(car);
                  setCompareBusy(false);
                  if (!vid) {
                    toast.message("Could not match this listing to a catalogue variant. Open the model page to compare.");
                    return;
                  }
                  const ok = addVariant(vid, { listingCarId: car.id });
                  trackEvent("compare_action", {
                    event_category: GA_CATEGORIES.compare,
                    car_id: car.id,
                    source: "detail",
                    action: ok ? "add" : "full",
                  });
                  if (!ok) toast.message("Compare is full (max 3).");
                  else toast.success("Added to compare.");
                })();
              }}
            >
              <GitCompare className="h-4 w-4 shrink-0" />
              {compareHas ? "Remove" : compareBusy ? "…" : "Add to compare"}
            </Button>
            <Button variant="outline" className="h-10 justify-center border-border sm:min-w-36" asChild>
              <Link href="/compare">Open compare</Link>
            </Button>
            {FEATURE_FLAGS.dealersEnabled ? (
              <Button variant="ghost" className="h-10 justify-center text-muted-foreground hover:text-foreground" asChild>
                <Link
                  href={`/companies/${companySlug}`}
                  onClick={() =>
                    trackEvent("dealer_profile_click", {
                      event_category: GA_CATEGORIES.conversion,
                      car_id: car.id,
                      company_slug: companySlug,
                    })
                  }
                >
                  Seller on record
                </Link>
              </Button>
            ) : null}
          </div>

          {FEATURE_FLAGS.dealersEnabled ? (
            <Card className="border-border bg-card shadow-none">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-foreground text-base font-bold text-background">
                  {company?.logoLetter ?? "A"}
                </div>
                <div className="min-w-0">
                  <p className={sectionLabel}>Listing source</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{company?.name ?? "Partner"}</p>
                  <p className="text-xs text-muted-foreground">{company?.tagline}</p>
                  <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3 shrink-0" />
                      Est. {company?.established}
                    </span>
                    <span className="text-muted-foreground/60">·</span>
                    <span>{company?.city}</span>
                  </div>
                  <Button variant="link" className="mt-1 h-auto p-0 text-primary hover:text-primary/85" asChild>
                    <Link href={`/companies/${companySlug}`}>View profile (context only) →</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
          </div>
        </div>
      </div>

      <div
        className="my-8 h-px w-full bg-linear-to-r from-transparent via-border to-transparent sm:my-10"
        role="separator"
        aria-hidden
      />

      <header className="relative mb-8 overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/10 blur-2xl motion-reduce:hidden" aria-hidden />
        <p className={sectionLabel}>Details</p>
        <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
          {car.brand} {car.model} — specs, history &amp; more
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Use the bar below to jump to a section, or scroll through in order.
        </p>
      </header>

      <CarDetailExploreSections car={car} coreSpecs={coreSpecs} reduceMotion={reduceMotion} />

      <section
        id="listing-faqs"
        className="relative mt-12 scroll-mt-36 overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:mt-14 sm:p-7"
      >
        <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-primary/8 blur-2xl motion-reduce:hidden" aria-hidden />
        <p className={sectionLabel}>Common questions</p>
        <h2 className="font-display mt-1 text-xl font-bold text-foreground sm:text-2xl">FAQs</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Quick answers about this listing.
        </p>
        <Accordion type="single" collapsible className="mt-4 w-full">
          <AccordionItem value="faq1" className="border-border">
            <AccordionTrigger className="text-left text-foreground transition-colors hover:text-primary hover:no-underline">
              What price is shown for this {car.brand} {car.model}?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              The listing shows {formatINR(car.price)} as advertised in our catalog. Anything beyond that — taxes,
              insurance, on-road charges — is outside what we verify here.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="faq2" className="border-border">
            <AccordionTrigger className="text-left text-foreground transition-colors hover:text-primary hover:no-underline">
              What mileage is listed for this {car.fuel} {car.bodyType.toLowerCase()}?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              The listing states {car.mileage}. Real-world economy varies with traffic, tyres, and maintenance; service
              records in the timeline below are part of the same informational snapshot.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="faq3" className="border-border">
            <AccordionTrigger className="text-left text-foreground transition-colors hover:text-primary hover:no-underline">
              Is this vehicle certified on Autolokate?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              {car.certified
                ? "Yes — see the inspection checklist in the details above."
                : "No — review the inspection section and consider an independent check."}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section className="relative mt-8 overflow-hidden rounded-3xl border border-border bg-muted/30 p-4 shadow-sm transition-shadow duration-300 hover:shadow-md sm:mt-10 sm:p-6">
        <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-primary/8 blur-2xl motion-reduce:hidden" aria-hidden />
        <p className={sectionLabel}>Keep researching</p>
        <h2 className="font-display mt-1 text-lg font-bold text-foreground sm:text-xl">Related on Autolokate</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          <li>
            <Link href="/compare" className={cn(linkAccent, "inline-flex rounded-lg px-1 py-0.5 transition-colors hover:bg-muted")}>
              Compare this model with other listings
            </Link>
          </li>
          <li>
            <Link href="/cars" className={cn(linkAccent, "inline-flex rounded-lg px-1 py-0.5 transition-colors hover:bg-muted")}>
              Back to full inventory
            </Link>
          </li>
          {FEATURE_FLAGS.dealersEnabled ? (
            <li>
              <Link href={`/companies/${companySlug}`} className={cn(linkAccent, "inline-flex rounded-lg px-1 py-0.5 transition-colors hover:bg-muted")}>
                Seller profile (context)
              </Link>
            </li>
          ) : null}
          {editorialPicks.map((a) => (
            <li key={a.slug}>
              <Link href={`/blog/${a.slug}`} className={cn(linkAccent, "inline-flex rounded-lg px-1 py-0.5 transition-colors hover:bg-muted")}>
                Read: {a.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 sm:mt-8">
        <CarDetailAiAssistant car={car} />
      </div>

      <div className="my-7 h-px w-full bg-linear-to-r from-transparent via-border to-transparent" role="separator" aria-hidden />
      <CarDetailPremiumSections car={car} />

      </div>

      <motion.div
        layout
        initial={{ y: 56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          delay: 0.12,
          type: "spring",
          stiffness: 320,
          damping: 32,
          mass: 0.85,
        }}
        className={cn(
          "fixed inset-x-0 z-40 border-t border-border/80 bg-background/95 px-2 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-[0_-12px_48px_-14px_rgba(24,24,27,0.08)] backdrop-blur-md sm:px-3 lg:left-1/2 lg:max-w-xl lg:-translate-x-1/2 lg:rounded-2xl lg:border lg:border-border/70 lg:px-3 lg:py-2.5 lg:shadow-lg lg:shadow-black/5",
          compareTrayCount > 0
            ? "bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] lg:bottom-[calc(6.75rem+env(safe-area-inset-bottom,0px))]"
            : "bottom-0 lg:bottom-5"
        )}
      >
        <div className="mx-auto flex min-w-0 max-w-7xl flex-wrap items-center justify-between gap-2 gap-y-2 sm:flex-nowrap sm:gap-3">
          <div className="min-w-0 max-w-[55%] flex-1 pr-1 sm:max-w-none sm:flex-none">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Listed at</p>
            <p className="truncate font-display text-sm font-bold tabular-nums text-foreground sm:text-base md:text-lg">{formatINR(car.price)}</p>
          </div>
          <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-1 sm:flex-nowrap sm:gap-1.5 md:gap-2">
            <Button size="sm" variant="outline" className="h-10 shrink-0 px-2.5 sm:px-3" asChild>
              <Link href="/cars">Browse</Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-10 shrink-0 px-2.5 sm:px-3"
              type="button"
              disabled={compareBusy}
              onClick={() => {
                if (compareHas) {
                  removeByListingId(car.id);
                  trackEvent("compare_action", {
                    event_category: GA_CATEGORIES.compare,
                    car_id: car.id,
                    source: "detail_bar",
                    action: "remove",
                  });
                  return;
                }
                setCompareBusy(true);
                void (async () => {
                  const vid = await resolveListingCarToVariantId(car);
                  setCompareBusy(false);
                  if (!vid) {
                    toast.message("Could not match to a catalogue variant.");
                    return;
                  }
                  const ok = addVariant(vid, { listingCarId: car.id });
                  trackEvent("compare_action", {
                    event_category: GA_CATEGORIES.compare,
                    car_id: car.id,
                    source: "detail_bar",
                    action: ok ? "add" : "full",
                  });
                  if (!ok) toast.message("Compare is full (max 3).");
                  else toast.success("Added to compare.");
                })();
              }}
            >
              <GitCompare className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">{compareHas ? "Remove" : compareBusy ? "…" : "Compare"}</span>
            </Button>
            {FEATURE_FLAGS.dealersEnabled ? (
              <Button size="sm" variant="ghost" className="hidden h-10 shrink-0 sm:inline-flex sm:px-3" asChild>
                <Link href={`/companies/${companySlug}`}>Seller</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
