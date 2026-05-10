"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Check, GitCompare } from "lucide-react";
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
  "group flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card text-left",
  "shadow-[0_2px_16px_-6px_rgba(0,0,0,0.14)]",
  "transition-[transform,box-shadow,border-color] duration-200 ease-out",
  "hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2),0_0_0_1px_rgba(37,99,235,0.1)]",
  "motion-reduce:transition-none motion-reduce:hover:translate-y-0"
);

export function AiMatchedCarCard({ row, onNavigate }: Props) {
  const router = useRouter();
  const addVariant = useCompareStore((s) => s.addVariant);
  const removeVariant = useCompareStore((s) => s.removeVariant);
  const hasVariant = useCompareStore((s) =>
    row.catalogueVariantId ? s.hasVariant(row.catalogueVariantId) : false
  );
  const trayCount = useCompareStore((s) => s.variantIds.length);
  const vid = row.catalogueVariantId;

  const toggleCompare = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!vid) return;
      if (hasVariant) {
        removeVariant(vid);
        trackEvent("compare_tray_toggle", { event_category: GA_CATEGORIES.compare, action: "remove", source: "ai_match_card", variant_id: vid });
        return;
      }
      const ok = addVariant(vid);
      if (!ok) {
        toast.message("Compare is full (max 3). Remove a variant first.");
        trackEvent("compare_tray_full", { event_category: GA_CATEGORIES.compare });
        return;
      }
      toast.success("Added to compare.");
      trackEvent("compare_tray_toggle", { event_category: GA_CATEGORIES.compare, action: "add", source: "ai_match_card", variant_id: vid });
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
      {/* ── 1. Full-width image with score badge overlaid ── */}
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-muted">
        {row.imageUrl ? (
          <Image
            src={row.imageUrl}
            alt={row.imageAlt}
            fill
            className="object-cover object-center transition duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 24rem"
            priority={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">No image</span>
          </div>
        )}

        {/* Score badge — top-right over image */}
        {row.score != null && (
          <div className={cn(
            "absolute right-3 top-3 flex min-w-[3.25rem] flex-col items-center rounded-xl px-3 py-2",
            /* light */ "border border-border/80 bg-white/95 shadow-[0_2px_8px_rgba(15,23,42,0.10)] backdrop-blur-md",
            /* dark  */ "dark:border-blue-400/50 dark:bg-zinc-900/95 dark:shadow-[0_2px_12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(96,165,250,0.2)]"
          )}>
            <span className="font-display text-2xl font-bold leading-none tabular-nums text-primary dark:text-white sm:text-[1.75rem]">
              {row.score}
            </span>
            <span className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.14em] text-muted-foreground dark:text-blue-400">
              Match score
            </span>
          </div>
        )}
      </div>

      {/* ── 2. Body ── */}
      <div className="flex flex-1 flex-col px-4 py-4 sm:px-5 sm:py-4">

        {/* Top row: name+subtitle (left) | price (right) */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-base font-bold leading-snug tracking-tight text-foreground sm:text-[1.0625rem]">
              {row.title}
            </h3>
            {row.variantLine ? (
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                {row.variantLine}
              </p>
            ) : null}
            {row.subtitle ? (
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground/70">
                {row.subtitle}
              </p>
            ) : null}
          </div>

          {row.priceLabel ? (
            <div className="shrink-0 text-right">
              <p className="font-display text-sm font-bold tracking-tight text-primary whitespace-nowrap sm:text-[0.9375rem]">
                {row.priceLabel}
              </p>
              <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">
                Ex-showroom
              </p>
            </div>
          ) : null}
        </div>

        {/* Reasons — 2-column grid */}
        {row.reasons.length > 0 && (
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
            {row.reasons.slice(0, 4).map((reason) => (
              <li
                key={reason}
                className="flex items-start gap-1.5 text-[10.5px] leading-snug text-muted-foreground sm:text-[11px]"
              >
                <span
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"
                  aria-hidden
                >
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
                {reason}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── 3. Footer ── */}
      <div className="mt-auto flex items-center justify-between border-t border-border/50 px-4 py-3 sm:px-5">
        {row.href ? (
          <span className="flex items-center gap-1 text-sm font-semibold text-primary transition-[gap,opacity] duration-150 group-hover:gap-2 group-hover:opacity-90">
            View full details
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Details unavailable</span>
        )}
      </div>
    </>
  );

  const compareRow =
    vid != null ? (
      <div className="flex gap-2 border-t border-border/50 bg-muted/20 px-4 py-2.5 sm:px-5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-8 flex-1 gap-1.5 rounded-xl border-border/60 text-xs font-semibold text-muted-foreground shadow-none",
            "hover:border-primary/30 hover:bg-muted/60 hover:text-foreground",
            hasVariant && "border-primary/30 bg-primary/8 text-primary hover:bg-primary/12"
          )}
          onClick={toggleCompare}
        >
          <GitCompare className="h-3.5 w-3.5 shrink-0" />
          {hasVariant ? "Remove" : "Compare"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 rounded-xl px-3 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground disabled:opacity-40"
          disabled={trayCount < 2}
          onClick={goCompare}
        >
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
