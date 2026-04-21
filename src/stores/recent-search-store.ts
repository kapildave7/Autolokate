import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX = 8;

type State = {
  items: string[];
  push: (q: string) => void;
  clear: () => void;
};

export const useRecentSearchStore = create<State>()(
  persist(
    (set, get) => ({
      items: [],
      push: (q) => {
        const t = q.trim();
        if (!t) return;
        const cur = get().items.filter((x) => x.toLowerCase() !== t.toLowerCase());
        set({ items: [t, ...cur].slice(0, MAX) });
      },
      clear: () => set({ items: [] }),
    }),
    { name: "autolokate-recent-search" }
  )
);
