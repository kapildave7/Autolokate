"use client";

import { useQuery } from "@tanstack/react-query";
import { cars, filterCars, type CarFilters } from "@/data";

/** Simulated network latency + filtered cars for React Query demos. */
export function useCarsQuery(filters: CarFilters) {
  return useQuery({
    queryKey: ["cars", filters],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 120 + Math.random() * 140));
      return filterCars(cars, filters);
    },
  });
}

export function useCarQuery(id: string | undefined) {
  return useQuery({
    queryKey: ["car", id],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 300));
      const car = cars.find((c) => c.id === id);
      if (!car) throw new Error("NOT_FOUND");
      return car;
    },
    enabled: Boolean(id),
  });
}
