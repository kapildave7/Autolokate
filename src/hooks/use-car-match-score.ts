"use client";

import { useMemo } from "react";
import type { Car } from "@/data/types";
import { useUserPrefsStore } from "@/stores/user-prefs-store";

/** Deterministic sample “AI match” 60–99% from prefs overlap */
export function useCarMatchScore(car: Car): number {
  const budgetMax = useUserPrefsStore((s) => s.budgetMax);
  const preferredFuels = useUserPrefsStore((s) => s.preferredFuels);
  const bodyTypes = useUserPrefsStore((s) => s.bodyTypes);

  return useMemo(() => {
    let score = 62;
    if (car.price <= budgetMax) score += 18;
    else if (car.price <= budgetMax * 1.15) score += 10;
    if (preferredFuels.includes(car.fuel)) score += 8;
    if (bodyTypes.includes(car.bodyType)) score += 7;
    if (car.certified) score += 4;
    if (car.trending) score += 2;
    const hash = car.matchProfileKey.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    score += hash % 6;
    return Math.min(99, score);
  }, [car, budgetMax, preferredFuels, bodyTypes]);
}
