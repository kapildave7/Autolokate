"use client";

import { create } from "zustand";
import { toast } from "sonner";
import {
  archiveAdvisorConversation,
  createAdvisorConversation,
  getAdvisorConversation,
  getAdvisorCurrentStep,
  getAdvisorResults,
  listAdvisorConversations,
  submitAdvisorAnswer,
  type AdvisorStep,
} from "@/lib/client/advisor-api";
import { humanizeOptionId, type PreferenceFinderAnswerEntry } from "@/components/discovery/preference-finder-utils";

export type PromptSnapshot = { city: string; body: string; fuel: string; budget: string };

export type { PreferenceFinderAnswerEntry };

type PreferenceFinderState = {
  conversationId: string | null;
  currentStep: AdvisorStep | null;
  completed: boolean;
  /** True briefly after a successful "Start over" so the hero can show restart-specific copy. Cleared on the next answer save. */
  recentlyRestartedSession: boolean;
  ready: boolean;
  bootstrapping: boolean;
  submitting: boolean;
  error: string | null;
  answerHistory: PreferenceFinderAnswerEntry[];
  stepMap: Record<string, AdvisorStep>;
  cityInput: string;
  multiDraft: string[];
  advisorResults: unknown | null;
  promptSnapshot: PromptSnapshot;
  setCityInput: (value: string) => void;
  setMultiDraft: (ids: string[]) => void;
  toggleMultiDraft: (id: string) => void;
  bootstrap: () => Promise<void>;
  resetJourney: () => Promise<void>;
  selectSingleOption: (optionId: string, optionLabel: string) => Promise<void>;
  confirmMultiSelect: (labelsById: Record<string, string>) => Promise<void>;
  jumpToStep: (stepId: string) => Promise<void>;
  clearError: () => void;
  /** True only after the user submits the final answer in this session — not after reload/hydration. */
  pendingCompletionCelebration: boolean;
  acknowledgeCompletionCelebration: () => void;
};

function stepToPromptKey(stepId: string): keyof PromptSnapshot | null {
  if (stepId === "city") return "city";
  if (stepId === "budget") return "budget";
  if (stepId === "body" || stepId === "body_type") return "body";
  if (stepId === "fuel" || stepId === "fuel_type") return "fuel";
  return null;
}

export const usePreferenceFinderStore = create<PreferenceFinderState>((set, get) => ({
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

  acknowledgeCompletionCelebration: () => set({ pendingCompletionCelebration: false }),

  setCityInput: (value) => set({ cityInput: value }),
  setMultiDraft: (ids) => set({ multiDraft: ids }),
  toggleMultiDraft: (id) =>
    set((s) => ({
      multiDraft: s.multiDraft.includes(id) ? s.multiDraft.filter((x) => x !== id) : [...s.multiDraft, id],
    })),
  clearError: () => set({ error: null }),

  bootstrap: async () => {
    set({ bootstrapping: true, error: null, ready: false });
    try {
      const conversations = await listAdvisorConversations(20);
      let selectedId = conversations[0]?.id ?? null;
      let initialStep: AdvisorStep | null = null;

      if (!selectedId) {
        const created = await createAdvisorConversation({ vehicle_category: "car", title: "Preference finder" });
        selectedId = created.id;
        initialStep = created.next_step ?? null;
      }

      if (!selectedId) {
        set({ error: "Unable to start your questionnaire.", ready: true, bootstrapping: false });
        return;
      }

      set({ conversationId: selectedId });

      const detail = await getAdvisorConversation(selectedId, 20);
      set({ answerHistory: detail?.answers ?? [] });

      if (initialStep) {
        set({
          currentStep: initialStep,
          stepMap: { ...get().stepMap, [initialStep.step_id]: initialStep },
          completed: false,
          pendingCompletionCelebration: false,
          multiDraft: initialStep.multi_select ? [] : [],
          ready: true,
          bootstrapping: false,
        });
        return;
      }

      const cur = await getAdvisorCurrentStep(selectedId);
      const step = cur?.step ?? null;
      if (step) {
        set((s) => ({
          currentStep: step,
          stepMap: { ...s.stepMap, [step.step_id]: step },
          multiDraft: step.multi_select ? [] : [],
        }));
      }

      const isCompleted = Boolean(cur?.completed);
      const advisorResults = isCompleted ? await getAdvisorResults(selectedId) : null;

      set({
        answerHistory: cur?.answers ?? detail?.answers ?? [],
        completed: isCompleted,
        pendingCompletionCelebration: false,
        ready: true,
        bootstrapping: false,
        ...(isCompleted ? { advisorResults, currentStep: null } : {}),
      });
    } catch {
      set({ error: "We could not load your questionnaire. Try again.", ready: true, bootstrapping: false });
    }
  },

  resetJourney: async () => {
    const previousConversationId = get().conversationId;
    set({
      conversationId: null,
      currentStep: null,
      completed: false,
      recentlyRestartedSession: false,
      ready: false,
      bootstrapping: true,
      answerHistory: [],
      stepMap: {},
      cityInput: "",
      multiDraft: [],
      advisorResults: null,
      promptSnapshot: { city: "", body: "", fuel: "", budget: "" },
      pendingCompletionCelebration: false,
      error: null,
    });
    try {
      // Keep history tidy: archive the prior in-progress thread before starting a fresh one.
      if (previousConversationId) {
        await archiveAdvisorConversation(previousConversationId).catch(() => {});
      }
      const created = await createAdvisorConversation({ vehicle_category: "car", title: "Preference finder" });
      const selectedId = created.id;
      const initialStep = created.next_step ?? null;
      if (!selectedId) {
        set({ error: "Unable to start a new session.", bootstrapping: false, ready: true });
        return;
      }
      set({ conversationId: selectedId });
      const detail = await getAdvisorConversation(selectedId, 20);
      set({ answerHistory: detail?.answers ?? [] });
      if (initialStep) {
        set({
          currentStep: initialStep,
          stepMap: { [initialStep.step_id]: initialStep },
          completed: false,
          pendingCompletionCelebration: false,
          multiDraft: initialStep.multi_select ? [] : [],
          ready: true,
          bootstrapping: false,
          recentlyRestartedSession: true,
        });
        return;
      }
      const cur = await getAdvisorCurrentStep(selectedId);
      const step = cur?.step ?? null;
      if (step) {
        set((s) => ({
          currentStep: step,
          stepMap: { ...s.stepMap, [step.step_id]: step },
          multiDraft: step.multi_select ? [] : [],
        }));
      }

      const isCompleted = Boolean(cur?.completed);
      const advisorResults = isCompleted ? await getAdvisorResults(selectedId) : null;

      set({
        answerHistory: cur?.answers ?? detail?.answers ?? [],
        completed: isCompleted,
        pendingCompletionCelebration: false,
        ready: true,
        bootstrapping: false,
        recentlyRestartedSession: !isCompleted,
        ...(isCompleted ? { advisorResults, currentStep: null } : {}),
      });
    } catch {
      set({ error: "Could not restart your journey.", bootstrapping: false, ready: true });
    }
  },

  selectSingleOption: async (optionId, optionLabel) => {
    const { conversationId, currentStep, submitting } = get();
    if (!conversationId || !currentStep || submitting) return;
    if (currentStep.multi_select) return;

    set({ submitting: true, error: null });
    try {
      const key = stepToPromptKey(currentStep.step_id);
      if (key) {
        set((s) => ({ promptSnapshot: { ...s.promptSnapshot, [key]: optionLabel } }));
      }

      set((s) => ({
        answerHistory: [
          ...s.answerHistory.filter((a) => a.step_id !== currentStep.step_id),
          {
            step_id: currentStep.step_id,
            selected_option_ids: [optionId],
            display_labels: [optionLabel.trim() || humanizeOptionId(optionId)],
          },
        ],
        stepMap: { ...s.stepMap, [currentStep.step_id]: currentStep },
      }));

      const res = await submitAdvisorAnswer(conversationId, {
        step_id: currentStep.step_id,
        selected_option_ids: [optionId],
      });

      if (res?.completed) {
        const results = await getAdvisorResults(conversationId);
        set({
          completed: true,
          currentStep: null,
          multiDraft: [],
          advisorResults: results,
          pendingCompletionCelebration: true,
          recentlyRestartedSession: false,
        });
      } else if (res?.next_step) {
        const next = res.next_step;
        set((s) => ({
          currentStep: next,
          stepMap: { ...s.stepMap, [next.step_id]: next },
          multiDraft: next.multi_select ? [] : s.multiDraft,
          recentlyRestartedSession: false,
        }));
      }
    } catch {
      set({ error: "Could not save your answer. Please try again." });
      toast.error("Could not save your answer.");
    } finally {
      set({ submitting: false });
    }
  },

  confirmMultiSelect: async (labelsById) => {
    const { conversationId, currentStep, submitting, multiDraft } = get();
    if (!conversationId || !currentStep || submitting || !currentStep.multi_select) return;
    if (multiDraft.length === 0) {
      toast.message("Select at least one option.");
      return;
    }

    set({ submitting: true, error: null });
    try {
      const labelJoined = multiDraft.map((id) => labelsById[id] ?? id).join(", ");
      const key = stepToPromptKey(currentStep.step_id);
      if (key) {
        set((s) => ({ promptSnapshot: { ...s.promptSnapshot, [key]: labelJoined } }));
      }

      set((s) => ({
        answerHistory: [
          ...s.answerHistory.filter((a) => a.step_id !== currentStep.step_id),
          {
            step_id: currentStep.step_id,
            selected_option_ids: multiDraft,
            display_labels: multiDraft.map((id) => (labelsById[id]?.trim() ? labelsById[id].trim() : humanizeOptionId(id))),
          },
        ],
        stepMap: { ...s.stepMap, [currentStep.step_id]: currentStep },
      }));

      const res = await submitAdvisorAnswer(conversationId, {
        step_id: currentStep.step_id,
        selected_option_ids: multiDraft,
      });

      if (res?.completed) {
        const results = await getAdvisorResults(conversationId);
        set({
          completed: true,
          currentStep: null,
          multiDraft: [],
          advisorResults: results,
          pendingCompletionCelebration: true,
          recentlyRestartedSession: false,
        });
      } else if (res?.next_step) {
        const next = res.next_step;
        set((s) => ({
          currentStep: next,
          stepMap: { ...s.stepMap, [next.step_id]: next },
          multiDraft: next.multi_select ? [] : [],
          recentlyRestartedSession: false,
        }));
      }
    } catch {
      set({ error: "Could not save your selections." });
      toast.error("Could not save your selections.");
    } finally {
      set({ submitting: false });
    }
  },

  jumpToStep: async (stepId) => {
    const { conversationId, stepMap, completed, answerHistory } = get();
    const s = stepMap[stepId];
    if (s) {
      const prev = answerHistory.find((a) => a.step_id === stepId);
      const restoredMulti =
        s.multi_select && prev?.selected_option_ids?.length ? [...prev.selected_option_ids] : s.multi_select ? [] : [];
      set({
        currentStep: s,
        completed: false,
        pendingCompletionCelebration: false,
        multiDraft: restoredMulti,
        error: null,
      });
      return;
    }
    if (!conversationId) return;
    try {
      const cur = await getAdvisorCurrentStep(conversationId);
      if (cur?.step) {
        set({
          currentStep: cur.step,
          completed: false,
          pendingCompletionCelebration: false,
          stepMap: { ...get().stepMap, [cur.step.step_id]: cur.step },
        });
        toast.info(completed ? "Editing will start from the current step in this session." : "Opened the latest step from the server.");
      }
    } catch {
      toast.error("Unable to open this step right now.");
    }
  },
}));
