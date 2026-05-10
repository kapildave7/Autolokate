"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  reduceMotion: boolean;
  current: number;
  total: number;
  percent: number;
  className?: string;
};

export function PreferenceFinderProgress({ reduceMotion, current, total, percent, className }: Props) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground dark:text-zinc-300">
          Step {current || 1} of {Math.max(total, 1)}
        </span>
        <span className="tabular-nums text-blue-500 dark:text-blue-400">{percent}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200/90 dark:bg-zinc-800">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={
            reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 24 }
          }
        />
      </div>
    </div>
  );
}
