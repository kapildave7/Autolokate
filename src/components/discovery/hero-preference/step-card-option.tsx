"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AdvisorOption } from "@/lib/client/advisor-api";
import { OptionIcon } from "@/components/discovery/hero-preference/option-icon";

type Props = {
  option: AdvisorOption;
  selected: boolean;
  disabled?: boolean;
  reduceMotion: boolean;
  index: number;
  onSelect: () => void;
};

export function StepCardOption({ option, selected, disabled, reduceMotion, index, onSelect }: Props) {
  return (
    <motion.button
      type="button"
      initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 sm:gap-3.5 sm:px-4 sm:py-4",
        selected
          ? "border-blue-400 bg-blue-50 ring-1 ring-blue-400/40 dark:border-blue-500/70 dark:bg-blue-500/10 dark:ring-blue-500/30"
          : "border-zinc-200/80 bg-white hover:border-zinc-300 hover:bg-zinc-50/80 dark:border-zinc-700/70 dark:bg-zinc-800/70 dark:hover:border-zinc-600 dark:hover:bg-zinc-800",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <OptionIcon option={option} />
      <span className={cn(
        "min-w-0 flex-1 text-sm font-semibold leading-snug sm:text-[0.9375rem]",
        selected
          ? "text-blue-700 dark:text-blue-300"
          : "text-foreground dark:text-zinc-200"
      )}>
        {option.label}
      </span>
    </motion.button>
  );
}
