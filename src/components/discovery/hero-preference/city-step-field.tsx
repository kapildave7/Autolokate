"use client";

import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  cityInput: string;
  onCityInput: (v: string) => void;
  allCities: string[];
  quickPick: (city: string) => void;
  disabled?: boolean;
};

export function CityStepField({ cityInput, onCityInput, allCities, quickPick, disabled }: Props) {
  const picks = allCities.slice(0, 10);
  return (
    <div className="space-y-5">
      <Input
        value={cityInput}
        onChange={(e) => onCityInput(e.target.value)}
        placeholder="Type your city"
        list="hero-pref-city-list"
        disabled={disabled}
        className="h-12 rounded-xl border-border/80 text-base"
      />
      <datalist id="hero-pref-city-list">
        {allCities.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Popular cities</p>
        <div className="flex flex-wrap gap-2">
          {picks.map((city) => {
            const active = cityInput.trim().toLowerCase() === city.toLowerCase();
            return (
              <button
                key={city}
                type="button"
                disabled={disabled}
                onClick={() => quickPick(city)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition",
                  active
                    ? "border-zinc-400 bg-zinc-200/90 text-foreground ring-1 ring-zinc-400/45 dark:border-zinc-500 dark:bg-zinc-300/50"
                    : "border-zinc-200/90 bg-white/80 text-foreground hover:border-zinc-300 hover:bg-white dark:border-zinc-300/50 dark:bg-white/55 dark:hover:bg-white/75"
                )}
              >
                {city}
              </button>
            );
          })}
        </div>
      </div>
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
        Choose a quick city or type yours, then tap Next.
      </p>
    </div>
  );
}
