"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cars } from "@/data";
import type { Car } from "@/data/types";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RemoteImageWithFallback } from "@/components/ui/remote-image";
import { exteriorFallbackForKey } from "@/lib/fallback-images";
import { carDetailPath } from "@/lib/seo/paths";
import Link from "next/link";
import { GA_CATEGORIES, carEntityParams, trackEvent } from "@/lib/analytics";

const LIMIT = 60;

export function CarQuickPicker({
  title,
  description,
  excludeIds = [],
  actionLabel = "Add",
  secondaryActionLabel = "View",
  onAction,
  disabled,
  analyticsContext = "picker",
}: {
  title: string;
  description?: string;
  excludeIds?: string[];
  actionLabel?: string;
  secondaryActionLabel?: string;
  onAction: (car: Car) => void;
  disabled?: boolean;
  /** Passed to GA as `picker_context` for funnels. */
  analyticsContext?: string;
}) {
  const [q, setQ] = useState("");
  const exclude = useMemo(() => new Set(excludeIds), [excludeIds]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    let list = cars;
    if (qq) {
      list = cars.filter((c) =>
        `${c.brand} ${c.model} ${c.variant} ${c.city} ${c.bodyType} ${c.fuel}`.toLowerCase().includes(qq)
      );
    }
    return list.slice(0, LIMIT);
  }, [q]);

  return (
    <div className="rounded-2xl border border-border bg-card/80 shadow-sm ring-1 ring-foreground/[0.04] backdrop-blur-sm">
      <div className="border-b border-border/80 p-5 sm:p-6">
        <h2 className="text-lg font-bold text-foreground sm:text-xl">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search brand, model, city, fuel…"
            className="h-11 border-border/90 bg-background pl-10"
            aria-label="Search cars"
          />
        </div>
      </div>
      <div className="max-h-[min(420px,50vh)] overflow-y-auto overscroll-contain p-3 sm:p-4">
        <ul className="space-y-2">
          {filtered.map((car) => {
            const taken = exclude.has(car.id);
            return (
              <li
                key={car.id}
                className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/80 p-2.5 transition hover:border-primary/25 hover:bg-secondary/30"
              >
                <div className="relative h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-secondary/40">
                  <RemoteImageWithFallback
                    src={car.images[0] ?? exteriorFallbackForKey(car.id)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="72px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {car.brand} {car.model}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {car.variant} · {car.city}
                  </p>
                  <p className="text-xs font-bold text-primary">{formatINR(car.price)}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row sm:items-center">
                  <Button size="sm" variant="outline" className="h-8 px-2.5 text-xs" asChild>
                    <Link
                      href={carDetailPath(car)}
                      onClick={() =>
                        trackEvent("car_quick_picker_view_listing", {
                          event_category: GA_CATEGORIES.compare,
                          picker_context: analyticsContext,
                          ...carEntityParams(car),
                        })
                      }
                    >
                      {secondaryActionLabel}
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    disabled={disabled || taken}
                    onClick={() => {
                      trackEvent("car_quick_picker_add", {
                        event_category: GA_CATEGORIES.compare,
                        picker_context: analyticsContext,
                        ...carEntityParams(car),
                      });
                      onAction(car);
                    }}
                  >
                    {taken ? "Added" : actionLabel}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No matches — try another search.</p>
        ) : null}
      </div>
    </div>
  );
}
