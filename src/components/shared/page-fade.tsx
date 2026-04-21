"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export function PageFade({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  /* Opacity-only: transform on this wrapper breaks `position: sticky` (e.g. expert CTA on listing pages). */
  return (
    <motion.div
      initial={{ opacity: reduce ? 1 : 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: reduce ? 0 : 0.38,
        ease,
      }}
    >
      {children}
    </motion.div>
  );
}
