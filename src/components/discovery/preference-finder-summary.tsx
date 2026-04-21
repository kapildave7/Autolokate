"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { entryDisplayLine, formatStepLabel, type PreferenceFinderAnswerEntry } from "@/components/discovery/preference-finder-utils";
import type { AdvisorStep } from "@/lib/client/advisor-api";

type Props = {
  reduceMotion: boolean;
  recommendationLine: string;
  onViewMatches: () => void;
  answerHistory: PreferenceFinderAnswerEntry[];
  stepMap: Record<string, AdvisorStep>;
  onEditStep: (stepId: string) => void;
};

export function PreferenceFinderSummary({
  reduceMotion,
  recommendationLine,
  onViewMatches,
  answerHistory,
  stepMap,
  onEditStep,
}: Props) {
  return (
    <motion.div
      key="done"
      initial={reduceMotion ? {} : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-linear-to-b from-zinc-50/90 via-card to-zinc-50/40 p-5 shadow-app-soft ring-1 ring-border/15 sm:rounded-[1.35rem] sm:p-7"
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-zinc-800 to-zinc-700 text-zinc-50 shadow-lg shadow-zinc-900/20">
            <CheckCircle2 className="h-7 w-7" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">All set</p>
            <h3 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">Preferences captured</h3>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">{recommendationLine}</p>
          </div>
        </div>

        <Button
          type="button"
          size="lg"
          className="relative h-12 w-full gap-2 rounded-xl bg-foreground text-background shadow-md transition hover:bg-foreground/92 sm:h-11 sm:w-auto sm:self-start"
          onClick={onViewMatches}
        >
          View your matches
          <ChevronRight className="h-4 w-4" />
        </Button>

        <div className="h-px w-full bg-linear-to-r from-transparent via-border to-transparent" aria-hidden />

        <div className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Your answers</p>
            <p className="text-xs text-muted-foreground">Tap to edit</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
            {answerHistory.map((entry, idx) => {
              const stepMeta = stepMap[entry.step_id];
              const selectedLabel = entryDisplayLine(entry, stepMeta);
              return (
                <motion.button
                  key={entry.step_id}
                  type="button"
                  initial={reduceMotion ? {} : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + idx * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={reduceMotion ? {} : { y: -2 }}
                  onClick={() => onEditStep(entry.step_id)}
                  className="group flex flex-col gap-1.5 rounded-xl border border-border/80 bg-muted/25 p-3.5 text-left shadow-sm transition hover:border-primary/35 hover:shadow-md sm:p-4"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{formatStepLabel(entry.step_id)}</span>
                  <span className="text-base font-semibold leading-snug tracking-tight text-foreground wrap-break-word sm:text-[1.02rem]">
                    {selectedLabel}
                  </span>
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary opacity-80 transition group-hover:opacity-100">
                    Edit
                    <ChevronRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
