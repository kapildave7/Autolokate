"use client";

import { useMemo, useRef, useEffect } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdvisorStep } from "@/lib/client/advisor-api";
import { entryDisplayLine, formatStepLabel, type PreferenceFinderAnswerEntry } from "@/components/discovery/preference-finder-utils";

type Props = {
  answerHistory: PreferenceFinderAnswerEntry[];
  currentStep: AdvisorStep | null;
  completed: boolean;
  stepMap: Record<string, AdvisorStep>;
  activeStepId: string | null;
  onSelectStep: (stepId: string) => void;
};

export function PreferenceFinderStepper({
  answerHistory,
  currentStep,
  completed,
  stepMap,
  activeStepId,
  onSelectStep,
}: Props) {
  const orderedStepIds = useMemo(() => {
    const ids = new Set<string>();
    answerHistory.forEach((a) => ids.add(a.step_id));
    if (currentStep?.step_id) ids.add(currentStep.step_id);
    return Array.from(ids).sort((a, b) => (stepMap[a]?.order ?? 999) - (stepMap[b]?.order ?? 999));
  }, [answerHistory, currentStep?.step_id, stepMap]);

  const activeRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeStepId]);

  if (orderedStepIds.length === 0) return null;

  return (
    <div className="relative -mx-1">
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {orderedStepIds.map((stepId) => {
          const answered = answerHistory.some((a) => a.step_id === stepId);
          const active = !completed && currentStep?.step_id === stepId;
          const done = completed || (answered && currentStep?.step_id !== stepId);
          const answerEntry = answerHistory.find((a) => a.step_id === stepId);
          const answerPreview =
            answered && answerEntry ? entryDisplayLine(answerEntry, stepMap[stepId]) : "";
          return (
            <button
              key={stepId}
              ref={active ? activeRef : undefined}
              type="button"
              onClick={() => onSelectStep(stepId)}
              className={cn(
                "flex min-w-[7.5rem] max-w-[11rem] shrink-0 flex-col items-start rounded-xl border px-3 py-2 text-left text-xs transition",
                active && "border-primary/45 bg-primary/10 text-primary shadow-sm",
                done && !active && "border-border/80 bg-muted/30 text-foreground hover:border-primary/25",
                !done && !active && "border-dashed border-border/70 bg-card text-muted-foreground"
              )}
            >
              <span className="flex items-center gap-1 font-semibold">
                {done ? <Check className="h-3.5 w-3.5 text-foreground" /> : null}
                {formatStepLabel(stepId)}
              </span>
              {answerPreview ? (
                <span className="mt-1 line-clamp-2 w-full text-[10px] font-medium leading-snug text-foreground/90" title={answerPreview}>
                  {answerPreview}
                </span>
              ) : null}
              <span className="mt-0.5 text-[10px] text-muted-foreground">{active ? "Current" : done ? "Tap to edit" : "Pending"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
