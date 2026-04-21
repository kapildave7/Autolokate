"use client";

import { RemoteImageWithFallback } from "@/components/ui/remote-image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Fuel, Gauge, GitCompare, Heart, MapPin, Store, User, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useMotionValue, useSpring, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { Car } from "@/data/types";
import { exteriorFallbackForKey } from "@/lib/fallback-images";
import { cn, formatINR } from "@/lib/utils";
import { carDetailPath } from "@/lib/seo/paths";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { toast } from "sonner";
import { useCompareStore } from "@/stores/compare-store";
import { resolveListingCarToVariantId } from "@/lib/compare-listing-resolve";
import { useSavedStore } from "@/stores/saved-store";
import { BrandLogo } from "@/components/brands/brand-logo";
import { CarListingImageBadges } from "@/components/cars/car-listing-image-badges";
import { GA_CATEGORIES, carEntityParams, trackEvent } from "@/lib/analytics";

export function CarCard({
  car,
  index = 0,
  variant = "grid",
}: {
  car: Car;
  index?: number;
  variant?: "grid" | "list";
}) {
  const addVariant = useCompareStore((s) => s.addVariant);
  const removeByListingId = useCompareStore((s) => s.removeByListingId);
  const compareHas = useCompareStore((s) => s.hasListing(car.id));
  const toggleSaved = useSavedStore((s) => s.toggle);
  const savedServer = useSavedStore((s) => s.has(car.id));
  const [mounted, setMounted] = useState(false);
  const [compareBusy, setCompareBusy] = useState(false);
  useEffect(() => setMounted(true), []);
  const saved = mounted && savedServer;
  const reduceMotion = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-60, 60], [6, -6]), { stiffness: 280, damping: 24 });
  const rotateY = useSpring(useTransform(mx, [-60, 60], [-6, 6]), { stiffness: 280, damping: 24 });
  const glowX = useTransform(mx, [-60, 60], [35, 65]);
  const glowY = useTransform(my, [-60, 60], [35, 65]);

  const imgBlock = (
    <div
      className={`relative shrink-0 overflow-hidden bg-secondary/30 ${
        variant === "list" ? "h-36 w-full sm:h-full sm:min-h-[160px] sm:w-72" : "aspect-[16/10]"
      }`}
    >
      <Link
        href={carDetailPath(car)}
        className="block h-full w-full"
        onClick={() =>
          trackEvent("select_item", {
            event_category: GA_CATEGORIES.cars_catalog,
            interaction: "image",
            list_position: index,
            ...carEntityParams(car),
          })
        }
      >
        <RemoteImageWithFallback
          src={car.images[0] ?? exteriorFallbackForKey(car.id)}
          alt={`${car.brand} ${car.model}`}
          fill
          className="object-cover transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07] motion-reduce:group-hover:scale-100"
          sizes={variant === "list" ? "(max-width:640px) 100vw, 288px" : "(max-width:768px) 100vw, 33vw"}
        />
      </Link>
      <div className={variant === "grid" ? "absolute left-3 top-3 z-[1]" : "absolute left-2 top-2 z-[1]"}>
        <CarListingImageBadges car={car} compact={variant === "list"} />
      </div>
    </div>
  );

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 10) * 0.02, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -4,
              transition: { type: "spring", stiffness: 420, damping: 28 },
            }
      }
      onMouseMove={(e) => {
        if (reduceMotion) return;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        mx.set(e.clientX - rect.left - rect.width / 2);
        my.set(e.clientY - rect.top - rect.height / 2);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      style={reduceMotion ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={cn(
        "group relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_4px_20px_-12px_rgba(15,23,42,0.1)] ring-1 ring-black/[0.03] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/18 hover:shadow-[0_12px_32px_-18px_rgba(15,23,42,0.14)] motion-reduce:transition-none",
        variant === "list" && "sm:flex-row sm:items-stretch"
      )}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={
          reduceMotion
            ? undefined
            : {
                background:
                  "radial-gradient(circle at var(--gx) var(--gy), rgba(249,115,22,0.14), rgba(249,115,22,0) 42%)",
                ["--gx" as string]: glowX,
                ["--gy" as string]: glowY,
              }
        }
      />
      {imgBlock}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col p-4">
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="inline-flex min-w-0 items-center gap-2">
                <BrandLogo brand={car.brand} size={24} />
                <Link
                  href={carDetailPath(car)}
                  className="min-w-0"
                  onClick={() =>
                    trackEvent("select_item", {
                      event_category: GA_CATEGORIES.cars_catalog,
                      interaction: "title",
                      list_position: index,
                      ...carEntityParams(car),
                    })
                  }
                >
                  <h3 className="text-lg font-bold tracking-tight text-foreground transition hover:text-primary">
                    {car.brand} {car.model}
                  </h3>
                </Link>
              </div>
              <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-snug text-muted-foreground sm:min-h-[2.75rem]">
                {car.variant?.trim() ? car.variant : "\u00a0"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !saved;
                trackEvent("save_to_shortlist", {
                  event_category: GA_CATEGORIES.cars_catalog,
                  saved: next,
                  list_position: index,
                  ...carEntityParams(car),
                });
                toggleSaved(car.id);
              }}
              className={cn(
                "shrink-0 rounded-xl border p-2 transition",
                saved
                  ? "border-cta-foreground/20 bg-cta text-cta-foreground"
                  : "border-border bg-secondary text-muted-foreground hover:border-primary/30 hover:text-cta-foreground"
              )}
              aria-label={saved ? "Remove from saved" : "Save car"}
            >
              <Heart className={cn("h-4 w-4", saved && "fill-current")} />
            </button>
          </div>

          <div className="min-h-[3.25rem] space-y-0.5">
            <p
              className={cn(
                "text-sm tabular-nums leading-tight",
                car.discountPercent > 0 ? "text-muted-foreground line-through" : "invisible"
              )}
              aria-hidden={car.discountPercent === 0}
            >
              {car.discountPercent > 0 ? formatINR(car.listPrice) : "\u00a0"}
            </p>
            <p className="text-xl font-bold tabular-nums text-foreground">{formatINR(car.price)}</p>
          </div>
          <p className="line-clamp-2 min-h-[2.5rem] text-xs leading-snug text-muted-foreground">
            <span>
              EMI ~{formatINR(car.estimatedEmiMonthly)}/mo ·{" "}
              <span className="inline-flex items-center gap-1 text-foreground/80">
                {car.sellerType === "Dealer" ? (
                  <Store className="h-3 w-3 shrink-0 text-primary" />
                ) : (
                  <User className="h-3 w-3 shrink-0 text-primary" />
                )}
                {car.sellerType}
              </span>
              {" · "}
              <span className="break-words" title={car.exteriorColor}>
                {car.exteriorColor?.trim() ? car.exteriorColor : "—"}
              </span>
            </span>
          </p>

          <div className="flex min-h-[2.75rem] flex-wrap content-start gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-lg bg-secondary/60 px-2 py-1">
              <Gauge className="h-3 w-3 shrink-0" />
              {car.year}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-secondary/60 px-2 py-1">
              {car.kms.toLocaleString("en-IN")} km
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-secondary/60 px-2 py-1">
              <Fuel className="h-3 w-3 shrink-0" />
              {car.fuel}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-secondary/60 px-2 py-1">
              <Users className="h-3 w-3 shrink-0" />
              {car.owners} owner{car.owners === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-secondary/60 px-2 py-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {car.city?.trim() ? car.city : "—"}
            </span>
          </div>
        </div>

        <div className="mt-auto flex shrink-0 flex-wrap gap-2 border-t border-border/40 pt-3">
          <Button size="sm" variant="listing" className="h-9 min-h-9 min-w-0 flex-1 justify-center px-3" asChild>
            <Link
              href={carDetailPath(car)}
              onClick={() =>
                trackEvent("cta_click", {
                  event_category: GA_CATEGORIES.cars_catalog,
                  event_label: "view_details",
                  list_position: index,
                  ...carEntityParams(car),
                })
              }
            >
              View Details
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            type="button"
            className={cn(
              "h-9 min-h-9 min-w-0 flex-1 justify-center gap-1.5 border-warn-soft-foreground/25 bg-warn-soft px-3 text-warn-soft-foreground shadow-none hover:border-primary/30 hover:bg-warn-soft/90",
              compareHas && "border-warn-soft-foreground/45 bg-warn-soft/95"
            )}
            disabled={compareBusy}
            onClick={() => {
              if (compareHas) {
                trackEvent("compare_tray_toggle", {
                  event_category: GA_CATEGORIES.compare,
                  action: "remove",
                  source: "car_card",
                  list_position: index,
                  ...carEntityParams(car),
                });
                removeByListingId(car.id);
                return;
              }
              setCompareBusy(true);
              void (async () => {
                const vid = await resolveListingCarToVariantId(car);
                setCompareBusy(false);
                if (!vid) {
                  toast.message("Could not match this listing to a catalogue variant. Try compare from a model page.");
                  return;
                }
                const ok = addVariant(vid, { listingCarId: car.id });
                trackEvent("compare_tray_toggle", {
                  event_category: GA_CATEGORIES.compare,
                  action: ok ? "add" : "reject_full",
                  source: "car_card",
                  list_position: index,
                  ...carEntityParams(car),
                });
                if (!ok) toast.message("Compare is full (max 3).");
                else toast.success("Added to compare.");
              })();
            }}
          >
            <GitCompare className="h-4 w-4 shrink-0" />
            {compareHas ? "Added" : compareBusy ? "…" : "Compare"}
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
