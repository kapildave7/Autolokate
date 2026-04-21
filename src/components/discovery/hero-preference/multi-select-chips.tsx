"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { AdvisorOption } from "@/lib/client/advisor-api";
import { cn } from "@/lib/utils";
import { OptionIcon } from "@/components/discovery/hero-preference/option-icon";

type Props = {
  options: AdvisorOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  disabled?: boolean;
  reduceMotion: boolean;
};

export function MultiSelectChips({ options, selectedIds, onToggle, disabled, reduceMotion }: Props) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {options.map((op, idx) => {
        const selected = selectedIds.includes(op.id);
        return (
          <motion.button
            key={op.id}
            type="button"
            initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03, duration: 0.25 }}
            disabled={disabled}
            onClick={() => onToggle(op.id)}
            className={cn(
              "flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-medium shadow-sm transition sm:px-4 sm:py-4",
              selected
                ? "border-zinc-400 bg-zinc-200/90 ring-1 ring-zinc-400/45 dark:border-zinc-500 dark:bg-zinc-300/50 dark:ring-zinc-500/40"
                : "border-zinc-200/90 bg-white/70 hover:border-zinc-300 hover:bg-white dark:border-zinc-300/50 dark:bg-white/50 dark:hover:border-zinc-400 dark:hover:bg-white/70",
              disabled && "pointer-events-none opacity-50"
            )}
          >
            <span className="relative shrink-0">
              <OptionIcon option={op} className="h-8 w-8" />
              {selected ? (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-white shadow dark:bg-zinc-950">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                </span>
              ) : null}
            </span>
            <span className="min-w-0 flex-1 leading-snug">{op.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
