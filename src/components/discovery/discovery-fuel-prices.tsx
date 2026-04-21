"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Fuel } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getFuelPrices } from "@/lib/client/prices-api";
import { formatINR } from "@/lib/utils";
import { usePreferenceFinderStore } from "@/stores/preference-finder-store";

function formatFuelRow(row: unknown): { title: string; detail: string } | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const fuel =
    String(r.fuel_type ?? r.fuel ?? r.name ?? "").trim() || "Fuel";
  const price = r.price ?? r.price_per_litre ?? r.rate ?? r.amount;
  const unit = r.unit ?? r.currency;
  let detail = "";
  if (typeof price === "number") {
    detail = formatINR(price);
    if (unit && typeof unit === "string") detail += ` / ${unit}`;
  } else if (price != null) {
    detail = String(price);
  } else {
    detail = JSON.stringify(r);
  }
  return { title: fuel, detail };
}

type Props = {
  /** Fallback when questionnaire city is empty */
  defaultCity: string;
  cities: string[];
};

export function DiscoveryFuelPrices({ defaultCity, cities }: Props) {
  const snapshotCity = usePreferenceFinderStore((s) => s.promptSnapshot.city);
  const initial = snapshotCity?.trim() || defaultCity;
  const [city, setCity] = useState(initial);

  const cityOptions = useMemo(() => {
    const merged = new Set<string>([initial, ...cities].filter(Boolean));
    if (!merged.has("Mumbai")) merged.add("Mumbai");
    return Array.from(merged).sort((a, b) => a.localeCompare(b));
  }, [cities, initial]);

  const { data: rows = [], isPending } = useQuery({
    queryKey: ["prices-fuel", city],
    queryFn: () => getFuelPrices(city),
    staleTime: 3_600_000,
  });

  const chips = useMemo(() => rows.map(formatFuelRow).filter(Boolean) as Array<{ title: string; detail: string }>, [rows]);

  return (
    <section className="border-b border-border bg-muted/20 py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <Fuel className="h-3.5 w-3.5" aria-hidden />
              Pump prices
            </p>
            <h2 className="font-display mt-1 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Fuel rates by city
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Live from the pricing API — data may be sparse until feeds backfill for your city.
            </p>
          </div>
          <div className="w-full min-w-[12rem] space-y-1.5 sm:max-w-xs">
            <Label htmlFor="fuel-city" className="text-xs text-muted-foreground">
              City
            </Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger id="fuel-city">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cityOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {isPending ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : chips.length ? (
            chips.map((c) => (
              <div
                key={`${c.title}-${c.detail}`}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-sm shadow-sm"
              >
                <span className="font-medium text-foreground">{c.title}</span>
                <span className="text-muted-foreground"> · {c.detail}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No pump prices returned for {city} yet.</p>
          )}
        </div>

      </div>
    </section>
  );
}
