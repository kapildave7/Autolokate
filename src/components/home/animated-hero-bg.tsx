"use client";

import { motion } from "framer-motion";

export function AnimatedHeroBg() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 opacity-30"
      animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
      transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      style={{
        backgroundImage:
          "linear-gradient(120deg, transparent 0%, rgba(251,146,60,0.1) 45%, transparent 80%)",
        backgroundSize: "200% 200%",
      }}
    />
  );
}
