"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronRight, Gauge, GitCompare } from "lucide-react";
import type { AdvisorMatchCard } from "@/lib/advisor-results-normalize";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCompareStore } from "@/stores/compare-store";
import { comparePathForIds } from "@/lib/seo/paths";
import { GA_CATEGORIES, trackEvent } from "@/lib/analytics";

type Props = {
  row: AdvisorMatchCard;
  onNavigate?: () => void;
};

const shellStyles = cn(
  "group flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card text-left text-[0.9375rem] shadow-[0_4px_18px_-12px_rgba(15,23,42,0.1)] ring-1 ring-black/[0.03] sm:text-[0.96875rem]",
  "transition-[transform,box-shadow,border-color] duration-200",
  "hover:-translate-y-0.5 hover:border-primary/15 hover:shadow-[0_12px_28px_-16px_rgba(15,23,42,0.14)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
);

export function AiMatchedCarCard({ row, onNavigate }: Props) {
  const router = useRouter();
  const addVariant = useCompareStore((s) => s.addVariant);
  const removeVariant = useCompareStore((s) => s.removeVariant);
  const hasVariant = useCompareStore((s) => (row.catalogueVariantId ? s.hasVariant(row.catalogueVariantId) : false));
  const trayCount = useCompareStore((s) => s.variantIds.length);

  const vid = row.catalogueVariantId;

  const toggleCompare = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!vid) return;
      if (hasVariant) {
        removeVariant(vid);
        trackEvent("compare_tray_toggle", {
          event_category: GA_CATEGORIES.compare,
          action: "remove",
          source: "ai_match_card",
          variant_id: vid,
        });
        return;
      }
      const ok = addVariant(vid);
      if (!ok) {
        toast.message("Compare is full (max 3). Remove a variant first.");
        trackEvent("compare_tray_full", { event_category: GA_CATEGORIES.compare });
        return;
      }
      toast.success("Added to compare.");
      trackEvent("compare_tray_toggle", {
        event_category: GA_CATEGORIES.compare,
        action: "add",
        source: "ai_match_card",
        variant_id: vid,
      });
    },
    [vid, hasVariant, addVariant, removeVariant]
  );

  const goCompare = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (trayCount < 2) {
        toast.message("Add at least two variants to open compare.");
        return;
      }
      router.push(comparePathForIds(useCompareStore.getState().variantIds));
    },
    [trayCount, router]
  );

  const main = (
    <>
      <div className="relative aspect-16/10 w-full shrink-0 overflow-hidden bg-muted sm:aspect-5/3">
        {row.imageUrl ? (
          <Image
            src={row.imageUrl}
            alt={row.imageAlt}
            fill
            className="object-cover object-center transition duration-300 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 24rem"
            priority={false}
          />
        ) : (
          <div className="flex h-full min-h-[100px] flex-col items-center justify-center bg-muted px-4 text-center sm:min-h-[108px]">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">No image</span>
          </div>
        )}
      </div>

      {row.score != null ? (
        <div className="shrink-0 border-b border-border bg-secondary/80 px-2.5 py-1.5 sm:px-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-[9px]">Match score</span>
            <span className="rounded-md border border-border/80 bg-background px-2 py-0.5 font-display text-xs font-semibold tabular-nums tracking-tight text-foreground shadow-sm sm:px-2.5 sm:py-1 sm:text-sm">
              {row.score}
            </span>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-2.5 pb-2.5 pt-2 sm:gap-2.5 sm:px-3 sm:pb-3 sm:pt-2.5">
        <div className="rounded-md border border-border/80 bg-muted/35 px-2.5 py-1.5 sm:rounded-lg sm:px-3 sm:py-2">
          <h3 className="font-display text-[0.875rem] font-semibold leading-snug tracking-tight text-foreground sm:text-[0.9375rem]">
            {row.title}
          </h3>
          {row.variantLine ? (
            <p className="mt-0.5 text-[0.6875rem] font-medium leading-snug text-foreground/90 sm:mt-1 sm:text-xs">{row.variantLine}</p>
          ) : null}
          {row.subtitle ? (
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground sm:mt-1.5 sm:text-[11px] lg:text-xs">{row.subtitle}</p>
          ) : null}
        </div>

        <div className="rounded-md border border-border/80 bg-muted/40 px-2.5 py-2 sm:rounded-lg sm:px-3 sm:py-2.5">
          <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-[9px]">Ex-showroom range</p>
          <p className="mt-0.5 font-display text-sm font-semibold tracking-tight text-foreground sm:mt-1 sm:text-base">
            {row.priceLabel}
          </p>
          {row.mileageKmpl != null ? (
            <div className="mt-1.5 flex items-start gap-2 border-t border-border/70 pt-1.5 text-[10px] leading-snug text-muted-foreground sm:mt-2 sm:pt-2 sm:text-[11px] lg:text-xs">
              <Gauge className="mt-0.5 h-2.5 w-2.5 shrink-0 text-muted-foreground sm:h-3 sm:w-3" aria-hidden />
              <span>
                Up to <span className="font-medium text-foreground">{row.mileageKmpl} km/l</span>
                <span className="text-muted-foreground"> (listed variant)</span>
              </span>
            </div>
          ) : null}
        </div>

        {row.reasons.length > 0 ? (
          <ul className="space-y-1">
            {row.reasons.slice(0, 4).map((reason) => (
              <li
                key={reason}
                className="flex gap-2 rounded-md border border-border/60 bg-muted/25 px-2 py-1.5 text-[10px] leading-snug text-foreground/95 sm:gap-2.5 sm:px-2.5 sm:py-2 sm:text-[11px] lg:text-xs"
              >
                <span
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary shadow-sm sm:h-5 sm:w-5"
                  aria-hidden
                >
                  <Check className="h-2 w-2 sm:h-2.5 sm:w-2.5" strokeWidth={3} />
                </span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border bg-muted/25 px-2.5 py-1.5 sm:px-3 sm:py-2">
        <span className="text-[0.6875rem] font-medium text-foreground sm:text-xs">{row.href ? "View full details" : "Details unavailable"}</span>
        {row.href ? (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/80 bg-muted/50 text-muted-foreground shadow-sm transition group-hover:border-primary/25 group-hover:bg-primary/10 group-hover:text-primary sm:h-8 sm:w-8">
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
          </span>
        ) : null}
      </div>
    </>
  );

  const compareRow =
    vid != null ? (
      <div className="flex flex-wrap gap-1.5 border-t border-border bg-background/80 px-2.5 py-2 sm:gap-2 sm:px-3 sm:py-2.5">
        <Button
          type="button"
          variant={hasVariant ? "secondary" : "outline"}
          size="sm"
          className="h-7 flex-1 gap-1 text-xs sm:h-8 sm:flex-initial sm:text-sm"
          onClick={toggleCompare}
        >
          <GitCompare className="h-3.5 w-3.5" />
          {hasVariant ? "Remove" : "Compare"}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 text-[0.6875rem] sm:h-8 sm:text-xs" disabled={trayCount < 2} onClick={goCompare}>
          Open compare
        </Button>
      </div>
    ) : null;

  if (row.href) {
    return (
      <div className={shellStyles}>
        <Link href={row.href} className="flex min-h-0 flex-1 flex-col" onClick={onNavigate}>
          {main}
        </Link>
        {compareRow}
      </div>
    );
  }

  return (
    <div className={cn(shellStyles, "cursor-default hover:translate-y-0 hover:shadow-sm")} role="group">
      {main}
      {compareRow}
    </div>
  );
}
