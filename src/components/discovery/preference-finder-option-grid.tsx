"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AdvisorStep } from "@/lib/client/advisor-api";

type Props = {
  reduceMotion: boolean;
  currentStep: AdvisorStep;
  cityInput: string;
  onCityInput: (value: string) => void;
  allCities: string[];
  submitting: boolean;
  multiDraft: string[];
  onToggleMulti: (id: string) => void;
  onConfirmMulti: () => void;
  onSelectSingle: (optionId: string, optionLabel: string) => void;
};

export function PreferenceFinderOptionGrid({
  reduceMotion,
  currentStep,
  cityInput,
  onCityInput,
  allCities,
  submitting,
  multiDraft,
  onToggleMulti,
  onConfirmMulti,
  onSelectSingle,
}: Props) {
  if (currentStep.step_id === "city") {
    return (
      <div className="space-y-5">
        <Input value={cityInput} onChange={(e) => onCityInput(e.target.value)} placeholder="Type your city" list="advisor-city-list" />
        <datalist id="advisor-city-list">
          {allCities.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>
        <div className="flex flex-wrap gap-2">
          {allCities.slice(0, 8).map((city) => (
            <button
              key={city}
              type="button"
              className="rounded-full border border-border/90 bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:border-primary/35 hover:bg-[#fff3e0]/80"
              onClick={() => onSelectSingle(city, city)}
              disabled={submitting}
            >
              {city}
            </button>
          ))}
          <Button type="button" variant="outline" disabled={!cityInput.trim() || submitting} onClick={() => onSelectSingle(cityInput.trim(), cityInput.trim())}>
            <MapPin className="h-4 w-4" />
            Confirm city
          </Button>
        </div>
      </div>
    );
  }

  if (currentStep.multi_select) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {currentStep.options.map((op, idx) => {
            const selected = multiDraft.includes(op.id);
            return (
              <motion.button
                key={op.id}
                type="button"
                initial={reduceMotion ? {} : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.25 }}
                className={cn(
                  "rounded-xl border px-4 py-3.5 text-left text-sm font-medium shadow-sm transition",
                  selected ? "border-primary/50 bg-primary/10 text-foreground ring-2 ring-primary/20" : "border-border bg-muted/60 hover:border-primary/30 hover:bg-card",
                  submitting && "opacity-60"
                )}
                onClick={() => onToggleMulti(op.id)}
                disabled={submitting}
              >
                {op.label}
              </motion.button>
            );
          })}
        </div>
        <Button type="button" className="w-full rounded-xl sm:w-auto" disabled={submitting || multiDraft.length === 0} onClick={onConfirmMulti}>
          Continue with selected
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {currentStep.options.map((op, idx) => (
        <motion.button
          key={op.id}
          type="button"
          initial={reduceMotion ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.04, duration: 0.28 }}
          className={cn(
            "rounded-xl border border-border bg-muted/60 px-4 py-3.5 text-left text-sm font-medium text-foreground shadow-sm transition hover:border-primary/35 hover:bg-[#fff3e0]/70 hover:shadow-md",
            submitting && "opacity-60"
          )}
          onClick={() => onSelectSingle(op.id, op.label)}
          disabled={submitting}
        >
          {op.label}
        </motion.button>
      ))}
    </div>
  );
}
