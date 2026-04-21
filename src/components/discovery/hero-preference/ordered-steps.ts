import type { AdvisorStep } from "@/lib/client/advisor-api";
import type { PreferenceFinderAnswerEntry } from "@/components/discovery/preference-finder-utils";

export function getOrderedStepIds(
  answerHistory: PreferenceFinderAnswerEntry[],
  currentStep: AdvisorStep | null,
  stepMap: Record<string, AdvisorStep>
): string[] {
  const ids = new Set<string>();
  answerHistory.forEach((a) => ids.add(a.step_id));
  if (currentStep?.step_id) ids.add(currentStep.step_id);
  return Array.from(ids).sort((a, b) => (stepMap[a]?.order ?? 999) - (stepMap[b]?.order ?? 999));
}

export function getCurrentStepPosition(ordered: string[], stepId: string | null | undefined): number {
  if (!stepId) return -1;
  return ordered.indexOf(stepId);
}
