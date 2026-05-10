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
        className="h-12 rounded-xl border-zinc-300 bg-white text-base focus-visible:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:ring-blue-500"
      />
      <datalist id="hero-pref-city-list">
        {allCities.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>
      <div>
        <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground dark:text-zinc-500">
          Popular cities
        </p>
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
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium shadow-sm transition-all",
                  active
                    ? "border-blue-400 bg-blue-50 text-blue-700 ring-1 ring-blue-400/40 dark:border-blue-500/70 dark:bg-blue-500/10 dark:text-blue-300"
                    : "border-zinc-200/80 bg-white text-foreground hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700/70 dark:bg-zinc-800/70 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                )}
              >
                {city}
              </button>
            );
          })}
        </div>
      </div>
      <p className="flex items-center gap-2 text-xs text-muted-foreground dark:text-zinc-500">
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Choose a quick city or type yours, then tap Next.
      </p>
    </div>
  );
}
