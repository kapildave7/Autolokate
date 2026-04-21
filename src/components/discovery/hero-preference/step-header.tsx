"use client";

import { PreferenceFinderProgress } from "@/components/discovery/preference-finder-progress";

type Props = {
  reduceMotion: boolean;
  title: string;
  stepLabel: string;
  current: number;
  total: number;
  percent: number;
};

export function StepHeader({ reduceMotion, title, stepLabel, current, total, percent }: Props) {
  return (
    <div className="space-y-3">
      {stepLabel ? (
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{stepLabel}</p>
      ) : null}
      <h2 className="font-display text-lg font-bold leading-snug tracking-tight text-foreground sm:text-xl">
        {title}
      </h2>
      <PreferenceFinderProgress reduceMotion={reduceMotion} current={current} total={total} percent={percent} />
    </div>
  );
}
