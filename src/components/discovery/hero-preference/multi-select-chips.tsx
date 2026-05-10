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
              "flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-medium shadow-sm transition-all sm:px-4 sm:py-4",
              selected
                ? "border-blue-400 bg-blue-50 ring-1 ring-blue-400/40 dark:border-blue-500/70 dark:bg-blue-500/10 dark:ring-blue-500/30"
                : "border-zinc-200/80 bg-white hover:border-zinc-300 hover:bg-zinc-50/80 dark:border-zinc-700/70 dark:bg-zinc-800/70 dark:hover:border-zinc-600 dark:hover:bg-zinc-800",
              disabled && "pointer-events-none opacity-50"
            )}
          >
            <span className="relative shrink-0">
              <OptionIcon option={op} className="h-9 w-9" />
              <span
                className={cn(
                  "absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full shadow transition-opacity duration-150",
                  selected
                    ? "bg-blue-500 opacity-100 dark:bg-blue-400"
                    : "pointer-events-none opacity-0"
                )}
                aria-hidden={!selected}
              >
                <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} aria-hidden />
              </span>
            </span>
            <span className={cn(
              "min-w-0 flex-1 leading-snug",
              selected ? "text-blue-700 dark:text-blue-300" : "text-foreground dark:text-zinc-200"
            )}>
              {op.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
