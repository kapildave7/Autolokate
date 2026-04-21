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
        "flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 sm:gap-4 sm:px-5 sm:py-4",
        selected
          ? "border-zinc-400 bg-zinc-200/90 ring-1 ring-zinc-400/45 dark:border-zinc-500 dark:bg-zinc-300/50 dark:ring-zinc-500/40"
          : "border-zinc-200/90 bg-white/70 hover:border-zinc-300 hover:bg-white dark:border-zinc-300/50 dark:bg-white/50 dark:hover:border-zinc-400 dark:hover:bg-white/70",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <OptionIcon option={option} />
      <span className="min-w-0 flex-1 pt-0.5 text-sm font-semibold leading-snug text-foreground sm:text-[0.9375rem]">
        {option.label}
      </span>
    </motion.button>
  );
}
