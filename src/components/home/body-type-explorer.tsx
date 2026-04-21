"use client";

import Link from "next/link";
import { bodyTypes } from "@/data";
import { cn } from "@/lib/utils";

export function BodyTypeExplorer() {
  const ordered = [...bodyTypes].slice(0, 8);
  return (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      {ordered.map((bt) => {
        const qs = new URLSearchParams({ bodyType: bt }).toString();
        const href = `/cars?${qs}`;
        const abbr = bt.length <= 4 ? bt.toUpperCase() : bt.slice(0, 3).toUpperCase();
        return (
          <Link
            key={bt}
            href={href}
            className={cn(
              "inline-flex items-center gap-2.5 rounded-full border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition",
              "hover:border-primary/35 hover:bg-primary/[0.04] hover:text-primary hover:shadow-md"
            )}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary"
              aria-hidden
            >
              {abbr}
            </span>
            {bt}
          </Link>
        );
      })}
      <Link
        href="/compare"
        className="inline-flex items-center rounded-full border border-dashed border-primary/40 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/10"
      >
        Compare tools
      </Link>
    </div>
  );
}
