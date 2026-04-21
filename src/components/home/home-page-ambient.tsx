"use client";

import { Building2, CarFront, Gauge, LayoutGrid, MapPin, Sparkles } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

const FLOATERS: {
  Icon: typeof CarFront;
  drift: "home-ambient-drift-a" | "home-ambient-drift-b" | "home-ambient-drift-c";
  delay: string;
  className: string;
}[] = [
  { Icon: CarFront, drift: "home-ambient-drift-a", delay: "0s", className: "top-[8%] left-[6%] h-16 w-16" },
  { Icon: Building2, drift: "home-ambient-drift-b", delay: "-8s", className: "top-[22%] right-[8%] h-14 w-14" },
  { Icon: LayoutGrid, drift: "home-ambient-drift-c", delay: "-4s", className: "top-[42%] left-[4%] h-12 w-12" },
  { Icon: Sparkles, drift: "home-ambient-drift-b", delay: "-14s", className: "top-[58%] right-[12%] h-11 w-11" },
  { Icon: MapPin, drift: "home-ambient-drift-a", delay: "-20s", className: "top-[72%] left-[10%] h-12 w-12" },
  { Icon: Gauge, drift: "home-ambient-drift-c", delay: "-11s", className: "top-[88%] right-[18%] h-11 w-11" },
  { Icon: CarFront, drift: "home-ambient-drift-c", delay: "-25s", className: "top-[35%] right-[22%] h-10 w-10" },
  { Icon: LayoutGrid, drift: "home-ambient-drift-a", delay: "-30s", className: "top-[65%] left-[18%] h-10 w-10" },
];

/**
 * Full-page whisper animation behind home content — slow drift, low contrast.
 */
export function HomePageAmbient({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(24,24,27,0.04),transparent_55%),radial-gradient(ellipse_60%_40%_at_100%_60%,rgba(24,24,27,0.03),transparent_50%)]" />
      {!reduceMotion
        ? FLOATERS.map(({ Icon, drift, delay, className: pos }, i) => (
            <Icon
              key={i}
              className={cn("home-ambient-icon absolute", drift, pos)}
              strokeWidth={1}
              style={{ animationDelay: delay }}
            />
          ))
        : null}
    </div>
  );
}
