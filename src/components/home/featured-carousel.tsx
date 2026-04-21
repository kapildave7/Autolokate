"use client";

import { RemoteImageWithFallback } from "@/components/ui/remote-image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { Car } from "@/data/types";
import { carDetailPath } from "@/lib/seo/paths";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function FeaturedCarousel({ cars }: { cars: Car[] }) {
  const [i, setI] = useState(0);
  const car = cars[i % cars.length];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-[0_24px_60px_-28px_rgba(15,23,42,0.18)] ring-1 ring-foreground/[0.05]">
      <div className="grid lg:grid-cols-2">
        <div className="relative aspect-[16/10] bg-muted lg:aspect-auto lg:min-h-[340px]">
          <motion.div
            key={car.id}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <RemoteImageWithFallback src={car.images[0]} alt="" fill className="object-cover" sizes="50vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/25 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-white/10 lg:to-white" />
          </motion.div>
        </div>
        <div className="flex flex-col justify-center px-6 py-8 sm:p-10 lg:pl-8 lg:pr-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Spotlight</p>
          <h3 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {car.brand} {car.model}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">{car.variant}</p>
          <div className="mt-6 rounded-2xl bg-primary/5 px-4 py-3 ring-1 ring-primary/10">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Reference price
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-primary sm:text-3xl">{formatINR(car.price)}</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="rounded-full px-6 shadow-md" asChild>
              <Link href={carDetailPath(car)}>View full details</Link>
            </Button>
            <Button variant="outline" className="rounded-full border-2 px-6" asChild>
              <Link href="/compare">Add to compare</Link>
            </Button>
          </div>
          <div className="mt-8 flex items-center gap-2 border-t border-border pt-6">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="rounded-full"
              onClick={() => setI((v) => (v - 1 + cars.length) % cars.length)}
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="rounded-full"
              onClick={() => setI((v) => (v + 1) % cars.length)}
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="ml-2 text-xs font-medium tabular-nums text-muted-foreground">
              {i + 1} / {cars.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
