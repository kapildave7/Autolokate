"use client";

import Link from "next/link";
import type { Car } from "@/data/types";
import { Button } from "@/components/ui/button";
import { RemoteImageWithFallback } from "@/components/ui/remote-image";
import { carDetailPath } from "@/lib/seo/paths";
import { formatINR } from "@/lib/utils";
import { exteriorFallbackForKey } from "@/lib/fallback-images";
import { buildCompareSlug } from "@/lib/seo/slugs";

function CarHalf({ car }: { car: Car }) {
  return (
    <Link href={carDetailPath(car)} className="group flex flex-col p-3 transition hover:bg-muted/50">
      <div className="relative mx-auto aspect-[5/3] w-full max-w-[128px] overflow-hidden rounded-xl bg-muted">
        <RemoteImageWithFallback
          src={car.images[0] ?? exteriorFallbackForKey(car.id)}
          alt=""
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
          sizes="128px"
        />
      </div>
      <p className="mt-2 text-center text-xs font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-primary">
        {car.brand} {car.model}
      </p>
      <p className="mt-1 text-center text-[11px] font-bold text-primary">{formatINR(car.price)}</p>
    </Link>
  );
}

function PairCard({ a, b }: { a: Car; b: Car }) {
  const compareHref = `/compare/${buildCompareSlug([a.id, b.id])}`;
  return (
    <div className="flex w-[min(85vw,340px)] shrink-0 snap-center flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-foreground/[0.04] sm:w-[300px] sm:snap-start">
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
        <CarHalf car={a} />
        <div className="flex items-center justify-center border-x border-border bg-card px-1">
          <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-black tracking-wide text-muted-foreground">
            VS
          </span>
        </div>
        <CarHalf car={b} />
      </div>
      <div className="flex items-center justify-center border-t border-border bg-muted/60 py-2">
        <Button size="sm" variant="listing" className="h-8 rounded-full px-5 text-xs font-semibold" asChild>
          <Link href={compareHref}>Compare now</Link>
        </Button>
      </div>
    </div>
  );
}

/** Full-viewport-width horizontal scroll — cards never wrap or overflow the page width. */
export function ComparePairsStrip({ cars: source }: { cars: Car[] }) {
  const pairs: [Car, Car][] = [];
  for (let i = 0; i + 1 < source.length && pairs.length < 6; i += 2) {
    pairs.push([source[i], source[i + 1]]);
  }
  if (pairs.length === 0) return null;
  return (
    <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-x-auto overflow-y-hidden overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
      <div
        className="flex w-max gap-4 px-4 pb-3 pt-1 snap-x snap-mandatory scroll-pl-4 sm:gap-5 sm:px-6 sm:scroll-pl-6 lg:px-8 lg:scroll-pl-8"
        role="list"
        aria-label="Suggested comparison pairs"
      >
        {pairs.map(([a, b]) => (
          <div key={`${a.id}-${b.id}`} role="listitem">
            <PairCard a={a} b={b} />
          </div>
        ))}
      </div>
    </div>
  );
}
