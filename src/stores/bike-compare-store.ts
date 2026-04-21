import { create } from "zustand";

const MAX = 3;

type BikeCompareState = {
  ids: string[];
  add: (id: string) => boolean;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
};

export const useBikeCompareStore = create<BikeCompareState>((set, get) => ({
  ids: [],
  add: (id) => {
    const { ids } = get();
    if (ids.includes(id)) return true;
    if (ids.length >= MAX) return false;
    set({ ids: [...ids, id] });
    return true;
  },
  remove: (id) => set({ ids: get().ids.filter((x) => x !== id) }),
  clear: () => set({ ids: [] }),
  has: (id) => get().ids.includes(id),
}));

