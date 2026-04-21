import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX = 12;

type State = {
  ids: string[];
  push: (id: string) => void;
  clear: () => void;
};

export const useRecentlyViewedStore = create<State>()(
  persist(
    (set, get) => ({
      ids: [],
      push: (id) => {
        const cur = get().ids.filter((x) => x !== id);
        set({ ids: [id, ...cur].slice(0, MAX) });
      },
      clear: () => set({ ids: [] }),
    }),
    { name: "autolokate-recently-viewed" }
  )
);
