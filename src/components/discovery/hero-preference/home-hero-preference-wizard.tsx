"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Building2, Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasAuthTokens } from "@/lib/client/auth-storage";
import { cn } from "@/lib/utils";
import { usePreferenceFinderStore } from "@/stores/preference-finder-store";
import { humanizeOptionId } from "@/components/discovery/preference-finder-utils";
import { getCurrentStepPosition, getOrderedStepIds } from "@/components/discovery/hero-preference/ordered-steps";
import { StepperWrapper } from "@/components/discovery/hero-preference/stepper-wrapper";
import { StepHeader } from "@/components/discovery/hero-preference/step-header";
import { StepContent } from "@/components/discovery/hero-preference/step-content";
import { StepFooter } from "@/components/discovery/hero-preference/step-footer";
import { StepCardOption } from "@/components/discovery/hero-preference/step-card-option";
import { CityStepField } from "@/components/discovery/hero-preference/city-step-field";
import { MultiSelectChips } from "@/components/discovery/hero-preference/multi-select-chips";
import {
  PreferenceCompletionCelebration,
  PreferenceNoMatchesCompletion,
} from "@/components/discovery/hero-preference/preference-completion-celebration";
import { normalizeAdvisorResultsToMatches } from "@/lib/advisor-results-normalize";
import { SummaryView } from "@/components/discovery/hero-preference/summary-view";

type Props = {
  reduceMotion: boolean;
  allCities: string[];
  recommendationLine: string;
  onViewMatches: () => void;
};

export function HomeHeroPreferenceWizard({ reduceMotion, allCities, recommendationLine, onViewMatches }: Props) {
  /** Match SSR + first hydrated paint: server has no localStorage, so assume logged out until client snapshot updates. */
  const loggedIn = useSyncExternalStore(
    () => () => {},
    () => hasAuthTokens(),
    () => false
  );
  const [pendingSingle, setPendingSingle] = useState<{ id: string; label: string } | null>(null);
  const [resetting, setResetting] = useState(false);

  const bootstrap = usePreferenceFinderStore((s) => s.bootstrap);
  const resetJourney = usePreferenceFinderStore((s) => s.resetJourney);
  const currentStep = usePreferenceFinderStore((s) => s.currentStep);
  const completed = usePreferenceFinderStore((s) => s.completed);
  const pendingCompletionCelebration = usePreferenceFinderStore((s) => s.pendingCompletionCelebration);
  const acknowledgeCompletionCelebration = usePreferenceFinderStore((s) => s.acknowledgeCompletionCelebration);
  const handleCelebrationContinue = useCallback(() => {
    acknowledgeCompletionCelebration();
    requestAnimationFrame(() => {
      document.getElementById("preference-finder-summary")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, [acknowledgeCompletionCelebration]);
  const ready = usePreferenceFinderStore((s) => s.ready);
  const bootstrapping = usePreferenceFinderStore((s) => s.bootstrapping);
  const submitting = usePreferenceFinderStore((s) => s.submitting);
  const error = usePreferenceFinderStore((s) => s.error);
  const answerHistory = usePreferenceFinderStore((s) => s.answerHistory);
  const stepMap = usePreferenceFinderStore((s) => s.stepMap);
  const cityInput = usePreferenceFinderStore((s) => s.cityInput);
  const multiDraft = usePreferenceFinderStore((s) => s.multiDraft);
  const setCityInput = usePreferenceFinderStore((s) => s.setCityInput);
  const toggleMultiDraft = usePreferenceFinderStore((s) => s.toggleMultiDraft);
  const selectSingleOption = usePreferenceFinderStore((s) => s.selectSingleOption);
  const confirmMultiSelect = usePreferenceFinderStore((s) => s.confirmMultiSelect);
  const jumpToStep = usePreferenceFinderStore((s) => s.jumpToStep);
  const clearError = usePreferenceFinderStore((s) => s.clearError);
  const advisorResultsPayload = usePreferenceFinderStore((s) => s.advisorResults);

  const hasCarMatches = useMemo(
    () => normalizeAdvisorResultsToMatches(advisorResultsPayload).length > 0,
    [advisorResultsPayload]
  );

  useEffect(() => {
    if (!loggedIn) {
      usePreferenceFinderStore.setState({
        conversationId: null,
        currentStep: null,
        completed: false,
        recentlyRestartedSession: false,
        ready: false,
        bootstrapping: false,
        submitting: false,
        error: null,
        answerHistory: [],
        stepMap: {},
        cityInput: "",
        multiDraft: [],
        advisorResults: null,
        promptSnapshot: { city: "", body: "", fuel: "", budget: "" },
        pendingCompletionCelebration: false,
      });
      setPendingSingle(null);
      return;
    }
    void bootstrap();
  }, [loggedIn, bootstrap]);

  const orderedStepIds = useMemo(
    () => getOrderedStepIds(answerHistory, currentStep, stepMap),
    [answerHistory, currentStep, stepMap]
  );

  const currentIndex = useMemo(
    () => getCurrentStepPosition(orderedStepIds, currentStep?.step_id),
    [orderedStepIds, currentStep?.step_id]
  );

  const progressCurrent = completed ? orderedStepIds.length : answerHistory.length + (currentStep ? 1 : 0);
  const progressTotal = Math.max(orderedStepIds.length, progressCurrent || 1);
  const progressPct = completed ? 100 : Math.round((progressCurrent / progressTotal) * 100);

  const answerKey = useMemo(
    () =>
      currentStep
        ? JSON.stringify(answerHistory.find((a) => a.step_id === currentStep.step_id) ?? null)
        : "",
    [answerHistory, currentStep]
  );

  useEffect(() => {
    const step = usePreferenceFinderStore.getState().currentStep;
    const history = usePreferenceFinderStore.getState().answerHistory;
    if (!step) {
      setPendingSingle(null);
      return;
    }
    if (step.multi_select) {
      setPendingSingle(null);
      return;
    }
    const prev = history.find((a) => a.step_id === step.step_id);
    if (step.step_id === "city") {
      const city = (prev?.display_labels?.[0] ?? prev?.selected_option_ids?.[0] ?? "").trim();
      if (city) {
        setCityInput(city);
        setPendingSingle({ id: city, label: city });
      } else {
        setPendingSingle(null);
      }
      return;
    }
    if (prev?.selected_option_ids?.[0]) {
      const id = prev.selected_option_ids[0];
      const label = prev.display_labels?.[0]?.trim() || humanizeOptionId(id);
      setPendingSingle({ id, label });
    } else {
      setPendingSingle(null);
    }
  }, [currentStep?.step_id, currentStep?.multi_select, answerKey, setCityInput]);

  const canProceed = useMemo(() => {
    if (!currentStep) return false;
    if (currentStep.multi_select) return multiDraft.length > 0;
    if (currentStep.step_id === "city") return Boolean(cityInput.trim() || pendingSingle?.label);
    return Boolean(pendingSingle?.id);
  }, [currentStep, multiDraft.length, cityInput, pendingSingle]);

  const handleNext = useCallback(async () => {
    if (!currentStep || submitting) return;
    if (currentStep.multi_select) {
      const map = Object.fromEntries(currentStep.options.map((o) => [o.id, o.label]));
      await confirmMultiSelect(map);
      return;
    }
    if (currentStep.step_id === "city") {
      const c = cityInput.trim() || pendingSingle?.label?.trim() || "";
      if (!c) return;
      await selectSingleOption(c, c);
      setPendingSingle(null);
      return;
    }
    if (pendingSingle) {
      await selectSingleOption(pendingSingle.id, pendingSingle.label);
      setPendingSingle(null);
    }
  }, [currentStep, submitting, confirmMultiSelect, selectSingleOption, cityInput, pendingSingle]);

  const handleBack = useCallback(() => {
    if (currentIndex <= 0) return;
    const prevId = orderedStepIds[currentIndex - 1];
    if (prevId) void jumpToStep(prevId);
  }, [currentIndex, orderedStepIds, jumpToStep]);

  const handleStartOver = useCallback(async () => {
    setResetting(true);
    try {
      await resetJourney();
      setPendingSingle(null);
    } finally {
      setResetting(false);
    }
  }, [resetJourney]);

  return (
    <motion.div
      id="preference-finder-stepper"
      role="region"
      aria-label="Car preference questionnaire"
      initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative flex w-full flex-col overflow-hidden rounded-2xl",
        loggedIn
          ? "min-h-[min(18rem,58vh)] border border-border bg-zinc-50 shadow-sm ring-1 ring-border/20 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-zinc-800/40"
          : "min-h-0 border-0 bg-transparent shadow-none ring-0"
      )}
    >
      {!loggedIn ? (
        <div className="flex flex-1 flex-col justify-center py-0.5">
          <article className="relative w-full max-w-[26.5rem] overflow-hidden rounded-2xl border border-border/90 bg-card shadow-[0_1px_0_rgba(15,23,42,0.05),0_12px_32px_-20px_rgba(15,23,42,0.18)] ring-1 ring-black/[0.03] sm:mx-auto">
            <div
              className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-zinc-500/[0.08] blur-2xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -left-6 bottom-0 h-20 w-20 rounded-full bg-foreground/[0.04] blur-2xl"
              aria-hidden
            />

            <header className="relative border-b border-border/70 bg-linear-to-b from-muted/50 to-card px-5 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Preference finder
                </span>
                <span className="rounded-md border border-border/80 bg-background/90 px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground backdrop-blur-sm">
                  4 · ~2 min
                </span>
              </div>
              <div className="mt-2.5 h-0.5 w-11 rounded-full bg-foreground/80" aria-hidden />
              <h3 className="font-display mt-3 text-balance text-xl font-semibold leading-[1.2] tracking-tight text-foreground sm:text-[1.35rem]">
                Shortlist with intent—not another filter maze.
              </h3>
              <p className="mt-2.5 text-[13px] leading-snug text-muted-foreground sm:text-sm">
                City, body, fuel & budget—wired to live listings so every match stays real.
              </p>
            </header>

            <div className="relative px-5 py-4 sm:px-6 sm:py-4.5">
              <ul className="grid gap-2">
                {(
                  [
                    { title: "Live ranking", body: "Updates each step—no stale “top picks.”" },
                    { title: "Saved on sign-in", body: "Matches + summary; edit anytime." },
                    { title: "To the model page", body: "Specs, price band, full detail." },
                  ] as const
                ).map((row) => (
                  <li
                    key={row.title}
                    className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 sm:gap-3.5 sm:px-3.5"
                  >
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background shadow-sm ring-1 ring-foreground/20"
                      aria-hidden
                    >
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                    <div className="min-w-0 leading-tight">
                      <p className="text-[13px] font-semibold text-foreground sm:text-sm">{row.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground sm:text-[13px]">{row.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <footer className="relative border-t border-border/70 bg-muted/15 px-5 py-4 sm:px-6 sm:py-4">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 border-border/90 bg-background/80 px-3 text-xs font-medium backdrop-blur-sm sm:h-8"
                    asChild
                  >
                    <Link href="/brands">
                      <Building2 className="h-3.5 w-3.5 opacity-80" aria-hidden />
                      Explore by brand
                    </Link>
                  </Button>
                  <Button size="sm" className="h-8 gap-1.5 px-3.5 text-xs font-semibold sm:h-8" asChild>
                    <Link href="/login">
                      Log in
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </Button>
                </div>
                <Link
                  href="/cars"
                  className="shrink-0 text-center text-[11px] font-medium text-muted-foreground underline-offset-2 transition hover:text-foreground hover:underline sm:text-left"
                >
                  All listings
                </Link>
              </div>
              <p className="mt-3 text-center text-[10px] leading-snug text-muted-foreground/90 sm:text-left">
                OTP to your phone · no password stored
              </p>
            </footer>
          </article>
        </div>
      ) : bootstrapping || !ready ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-zinc-50 px-4 py-12 dark:bg-zinc-950 sm:px-5">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500 dark:text-blue-400" />
          <p className="text-sm text-muted-foreground">Loading questionnaire…</p>
        </div>
      ) : error ? (
        <div className="flex flex-1 flex-col justify-center bg-zinc-50 px-4 py-8 dark:bg-zinc-950 sm:px-5">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <Button type="button" variant="outline" className="mt-4 w-fit rounded-xl" onClick={() => { clearError(); void bootstrap(); }}>
            Retry
          </Button>
        </div>
      ) : (
        <StepperWrapper className="flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
          {!completed && currentStep ? (
            <>
              <div className="border-b border-zinc-200/80 bg-zinc-50 px-4 pb-4 pt-3 dark:border-zinc-800 dark:bg-zinc-950 sm:px-5 sm:pb-4 sm:pt-3">
                <div className="mb-3 flex items-center gap-1.5 border-b border-zinc-200/60 pb-3 dark:border-zinc-800/80">
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" aria-hidden />
                  <span className="text-xs font-semibold tracking-wide text-foreground">Smart Car Finder</span>
                </div>
                <StepHeader
                  reduceMotion={reduceMotion}
                  title={currentStep.question}
                  stepLabel=""
                  current={Math.max(1, currentIndex + 1)}
                  total={Math.max(progressTotal, 1)}
                  percent={progressPct}
                />
              </div>
              <div className="relative flex min-h-0 flex-1 flex-col bg-zinc-50 px-4 pb-0 pt-4 dark:bg-zinc-950 sm:px-5 sm:pt-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep.step_id}
                    initial={reduceMotion ? undefined : { opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, x: -14 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="flex min-h-0 flex-1 flex-col"
                  >
                    <StepContent>
                      {currentStep.step_id === "city" ? (
                        <CityStepField
                          cityInput={cityInput}
                          onCityInput={setCityInput}
                          allCities={allCities}
                          disabled={submitting}
                          quickPick={(city) => {
                            setCityInput(city);
                            setPendingSingle({ id: city, label: city });
                          }}
                        />
                      ) : currentStep.multi_select ? (
                        <MultiSelectChips
                          options={currentStep.options}
                          selectedIds={multiDraft}
                          onToggle={toggleMultiDraft}
                          disabled={submitting}
                          reduceMotion={reduceMotion}
                        />
                      ) : (
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          {currentStep.options.map((op, idx) => (
                            <StepCardOption
                              key={op.id}
                              option={op}
                              index={idx}
                              reduceMotion={reduceMotion}
                              disabled={submitting}
                              selected={pendingSingle?.id === op.id}
                              onSelect={() => setPendingSingle({ id: op.id, label: op.label })}
                            />
                          ))}
                        </div>
                      )}
                    </StepContent>
                  </motion.div>
                </AnimatePresence>
              </div>
              <StepFooter
                showBack={currentIndex > 0}
                onBack={handleBack}
                onNext={() => void handleNext()}
                nextDisabled={!canProceed}
                loading={submitting}
                nextLabel={currentStep.multi_select ? "Save & continue" : "Next"}
              />
            </>
          ) : (
            <AnimatePresence mode="wait">
              {completed && pendingCompletionCelebration ? (
                hasCarMatches ? (
                  <PreferenceCompletionCelebration
                    key="completion-celebration"
                    reduceMotion={reduceMotion}
                    onContinue={handleCelebrationContinue}
                  />
                ) : (
                  <PreferenceNoMatchesCompletion
                    key="completion-no-matches"
                    reduceMotion={reduceMotion}
                    onContinue={handleCelebrationContinue}
                  />
                )
              ) : (
                <motion.div
                  key="preference-summary"
                  initial={reduceMotion ? undefined : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-1 flex-col bg-zinc-50 px-4 py-5 dark:bg-zinc-950 sm:px-5 sm:py-6"
                >
                  <SummaryView
                    reduceMotion={reduceMotion}
                    recommendationLine={recommendationLine}
                    onViewMatches={onViewMatches}
                    onStartOver={handleStartOver}
                    answerHistory={answerHistory}
                    stepMap={stepMap}
                    resetting={resetting}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </StepperWrapper>
      )}
    </motion.div>
  );
}
