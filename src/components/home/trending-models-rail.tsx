"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { RemoteImageWithFallback } from "@/components/ui/remote-image";
import { cn } from "@/lib/utils";

export type TrendingCatalogueItem = {
  id: string;
  href: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  imageAlt: string;
  priceLabel: string;
};

/**
 * Horizontal rail contained in the parent width (no w-screen breakout — avoids page-level horizontal overflow).
 * Edge fades sit inside the scroll viewport so they don’t clip oddly on small screens.
 */
export function TrendingModelsRail({ items }: { items: TrendingCatalogueItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="relative min-w-0">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-8 bg-linear-to-r from-background to-transparent sm:w-10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-8 bg-linear-to-l from-background to-transparent sm:w-10"
        aria-hidden
      />

      <div
        className="overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="flex w-max snap-x snap-mandatory gap-3 pb-2 pt-0.5 sm:gap-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "group flex w-[10.75rem] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-foreground/[0.04] transition duration-300 sm:w-[11.75rem] md:w-[12.25rem]",
                "hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md"
              )}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                <RemoteImageWithFallback
                  src={item.imageUrl ?? ""}
                  alt={item.imageAlt}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 42vw, 200px"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-linear-to-t from-background/92 via-background/15 to-transparent"
                  aria-hidden
                />
                <div className="absolute bottom-2 left-2.5 right-2.5">
                  <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-foreground sm:text-[13px]">
                    {item.title}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground sm:text-[11px]">{item.subtitle}</p>
                </div>
              </div>
              <div className="border-t border-border/80 bg-card px-3 py-2.5 sm:px-3.5 sm:py-3">
                <p className="line-clamp-2 font-display text-sm font-semibold tabular-nums leading-tight text-foreground sm:text-[15px]">
                  {item.priceLabel}
                </p>
                <span className="mt-1.5 inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-600 transition group-hover:text-[#2563eb] dark:text-slate-400 dark:group-hover:text-blue-400 sm:text-[11px]">
                  View model
                  <ChevronRight className="h-3 w-3 transition group-hover:translate-x-0.5 sm:h-3.5 sm:w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
