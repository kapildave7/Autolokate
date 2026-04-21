import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Sample preference vector for “AI match score” UI */
type State = {
  budgetMax: number;
  preferredFuels: string[];
  bodyTypes: string[];
  setBudget: (n: number) => void;
  toggleFuel: (f: string) => void;
  toggleBody: (b: string) => void;
};

export const useUserPrefsStore = create<State>()(
  persist(
    (set, get) => ({
      budgetMax: 2500000,
      preferredFuels: ["Petrol", "Diesel"],
      bodyTypes: ["SUV", "Sedan"],
      setBudget: (n) => set({ budgetMax: n }),
      toggleFuel: (f) => {
        const cur = get().preferredFuels;
        set({
          preferredFuels: cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f],
        });
      },
      toggleBody: (b) => {
        const cur = get().bodyTypes;
        set({
          bodyTypes: cur.includes(b) ? cur.filter((x) => x !== b) : [...cur, b],
        });
      },
    }),
    { name: "autolokate-user-prefs" }
  )
);
