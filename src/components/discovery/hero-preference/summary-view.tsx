"use client";

import { motion } from "framer-motion";
import { ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { entryDisplayLine, formatStepLabel, type PreferenceFinderAnswerEntry } from "@/components/discovery/preference-finder-utils";
import type { AdvisorStep } from "@/lib/client/advisor-api";

type Props = {
  reduceMotion: boolean;
  recommendationLine: string;
  onViewMatches: () => void;
  onStartOver: () => void;
  answerHistory: PreferenceFinderAnswerEntry[];
  stepMap: Record<string, AdvisorStep>;
  resetting?: boolean;
};

export function SummaryView({
  reduceMotion,
  recommendationLine,
  onViewMatches,
  onStartOver,
  answerHistory,
  stepMap,
  resetting,
}: Props) {
  return (
    <motion.div
      id="preference-finder-summary"
      key="summary"
      initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="space-y-6"
    >
      <header className="space-y-2 border-b border-zinc-200/80 pb-5 dark:border-zinc-300/40">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Summary</p>
        <h3 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.65rem] sm:leading-tight">
          What you chose
        </h3>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">{recommendationLine}</p>
      </header>

      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Your answers</p>
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {answerHistory.map((entry, idx) => {
            const stepMeta = stepMap[entry.step_id];
            const line = entryDisplayLine(entry, stepMeta);
            return (
              <motion.li
                key={entry.step_id}
                initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 + idx * 0.02, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-xl border border-zinc-200/80 bg-white/90 px-3.5 py-3 shadow-sm ring-1 ring-zinc-950/3 dark:border-zinc-300/45 dark:bg-white/70 dark:ring-white/10"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {formatStepLabel(entry.step_id)}
                </p>
                <p className="mt-1.5 text-sm font-semibold leading-snug text-foreground">{line}</p>
              </motion.li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-col gap-3 border-t border-zinc-200/70 pt-5 dark:border-zinc-300/40 sm:flex-row sm:flex-wrap sm:items-stretch">
        <Button
          type="button"
          size="lg"
          className="h-11 w-full rounded-xl bg-foreground text-background shadow-md transition hover:bg-foreground/90 sm:h-12 sm:min-w-[200px] sm:flex-1 sm:max-w-xs"
          onClick={onViewMatches}
        >
          View matching cars
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-11 w-full rounded-xl border-zinc-300/90 bg-white/90 text-foreground shadow-sm hover:bg-white dark:border-zinc-400 dark:bg-white/60 dark:hover:bg-white/85 sm:h-12 sm:w-auto sm:min-w-[140px]"
          disabled={resetting}
          onClick={() => void onStartOver()}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Start over
        </Button>
      </div>
    </motion.div>
  );
}
