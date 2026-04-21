"use client";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * Decorative hero backdrop: soft “route” curves + drifting light orbs.
 * Motion is slow and low-contrast; disabled when reduced motion is preferred.
 */
export function HeroJourneyAmbient() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {/* Soft neutral mist — very slow drift (CSS disables under prefers-reduced-motion) */}
      <div className="hero-ambient-orb hero-ambient-orb-a absolute rounded-full blur-3xl" />
      <div className="hero-ambient-orb hero-ambient-orb-b absolute rounded-full blur-3xl" />

      {/* Abstract journey lines — suggests a calm drive / decision path */}
      <svg
        className="absolute -left-[8%] top-1/2 h-[130%] w-[125%] -translate-y-1/2 text-primary/[0.09] sm:text-primary/[0.07]"
        viewBox="0 0 1200 640"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M-40 360 C 180 340, 320 300, 480 328 S 760 400, 980 352 L 1240 320"
          stroke="currentColor"
          strokeWidth="1.1"
          vectorEffect="non-scaling-stroke"
          className={cn(!reduceMotion && "hero-journey-dash")}
        />
        <path
          d="M-20 420 C 200 450, 380 380, 560 400 S 820 480, 1120 430 L 1240 400"
          stroke="currentColor"
          strokeWidth="0.85"
          opacity={0.65}
          vectorEffect="non-scaling-stroke"
          className={cn(!reduceMotion && "hero-journey-dash-slow")}
        />
        <path
          d="M0 280 C 240 260, 400 220, 600 260 S 880 300, 1200 240"
          stroke="currentColor"
          strokeWidth="0.65"
          opacity={0.45}
          vectorEffect="non-scaling-stroke"
          className={cn(!reduceMotion && "hero-journey-dash-reverse")}
        />
      </svg>

      {/* Teal accent thread — ties to product CTAs without competing */}
      <svg
        className="absolute bottom-0 right-[-5%] h-[55%] w-[70%] text-zinc-500/[0.06]"
        viewBox="0 0 600 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMaxYMax slice"
      >
        <path
          d="M40 380 C 160 320, 280 280, 420 300 S 520 360, 580 200"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          className={cn(!reduceMotion && "hero-journey-dash-teal")}
        />
      </svg>
    </div>
  );
}
