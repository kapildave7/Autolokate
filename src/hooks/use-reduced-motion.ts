"use client";

import { useReducedMotion as useFramerReducedMotion } from "framer-motion";

/** SSR-safe: null until mounted; treat as reduced motion when true. */
export function useReducedMotion(): boolean {
  const prefers = useFramerReducedMotion();
  return prefers === true;
}
