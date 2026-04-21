import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SavedComparison = {
  id: string;
  name: string;
  carIds: string[];
  savedAt: string;
};

type State = {
  saved: SavedComparison[];
  save: (name: string, carIds: string[]) => void;
  remove: (id: string) => void;
};

export const useSavedComparisonsStore = create<State>()(
  persist(
    (set) => ({
      saved: [],
      save: (name, carIds) =>
        set((s) => ({
          saved: [
            {
              id: `cmp-${Date.now()}`,
              name,
              carIds: [...carIds],
              savedAt: new Date().toISOString().slice(0, 10),
            },
            ...s.saved,
          ].slice(0, 15),
        })),
      remove: (id) => set((s) => ({ saved: s.saved.filter((x) => x.id !== id) })),
    }),
    { name: "autolokate-saved-comparisons" }
  )
);
