import { create } from "zustand";
import { persist } from "zustand/middleware";

type SavedState = {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
};

export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const cur = get().ids;
        if (cur.includes(id)) set({ ids: cur.filter((x) => x !== id) });
        else set({ ids: [...cur, id] });
      },
      has: (id) => get().ids.includes(id),
    }),
    { name: "autolokate-saved" }
  )
);
