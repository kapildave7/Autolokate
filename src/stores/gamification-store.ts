import { create } from "zustand";
import { persist } from "zustand/middleware";

type State = {
  points: number;
  referralCode: string;
  addPoints: (n: number) => void;
};

export const useGamificationStore = create<State>()(
  persist(
    (set) => ({
      points: 120,
      referralCode: "AUTO-KAP-9F2",
      addPoints: (n) => set((s) => ({ points: s.points + n })),
    }),
    { name: "autolokate-gamify" }
  )
);
