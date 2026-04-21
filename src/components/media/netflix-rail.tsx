"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

type NetflixRailProps = {
  title: string;
  subtitle?: string;
  id?: string;
  children: ReactNode;
  /** Smaller top margin when stacked under hero */
  dense?: boolean;
};

export function NetflixRail({ title, subtitle, id, children, dense }: NetflixRailProps) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`scroll-mt-24 ${dense ? "mb-10" : "mb-14"}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-xl font-bold tracking-tight text-transparent sm:text-2xl">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="relative">
        <div
          className="pointer-events-none absolute left-0 top-0 z-10 h-full w-10 bg-gradient-to-r from-[#050608] via-[#050608]/90 to-transparent sm:w-14 lg:w-20"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l from-[#050608] via-[#050608]/90 to-transparent sm:w-14 lg:w-20"
          aria-hidden
        />
        <div className="mx-auto flex max-w-7xl gap-4 overflow-x-auto px-4 pb-2 pt-1 [scrollbar-width:thin] snap-x snap-mandatory sm:gap-5 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </motion.section>
  );
}
