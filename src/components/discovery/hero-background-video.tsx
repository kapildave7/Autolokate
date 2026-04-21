"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * Hero loop — use a stable filename. Source: copy your `bg.mp4` from Downloads to this path.
 * (Avoid `/videos/bg.mp4` alone: browsers often cache MP4s aggressively after URL reuse.)
 */
export const HERO_BACKGROUND_VIDEO_SRC = "/videos/home-hero-background.mp4";

type Props = {
  className?: string;
  /** Skip light brand scrims when a parent applies a dark overlay (e.g. home hero). */
  minimalScrims?: boolean;
};

/**
 * Full-bleed looping hero video. Optional scrims; falls back to mesh gradient if reduced motion
 * is on or the file fails to load.
 */
export function HeroBackgroundVideo({ className, minimalScrims = false }: Props) {
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    if (reduceMotion || useFallback) return;
    const el = videoRef.current;
    if (!el) return;
    void el.play().catch(() => setUseFallback(true));
  }, [reduceMotion, useFallback]);

  if (reduceMotion || useFallback) {
    return (
      <div
        className={cn("pointer-events-none absolute inset-0 z-0 bg-hero-mesh bg-cover bg-center", className)}
        aria-hidden
      />
    );
  }

  return (
    <div className={cn("pointer-events-none absolute inset-0 z-0 overflow-hidden bg-black", className)} aria-hidden>
      <video
        key={HERO_BACKGROUND_VIDEO_SRC}
        ref={videoRef}
        className={cn(
          "absolute left-1/2 top-1/2 h-full min-h-full w-full min-w-full -translate-x-1/2 -translate-y-1/2 scale-[1.02] object-cover contrast-[1.02] saturate-[1.05]",
          minimalScrims ? "brightness-[0.88]" : "brightness-[1.05]"
        )}
        src={HERO_BACKGROUND_VIDEO_SRC}
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
        onError={() => setUseFallback(true)}
        onLoadedData={() => {
          const el = videoRef.current;
          if (!el || reduceMotion || useFallback) return;
          void el.play().catch(() => setUseFallback(true));
        }}
      />
      {minimalScrims ? (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_50%_45%,transparent_32%,rgba(0,0,0,0.45)_100%)]" />
      ) : (
        <>
          <div className="absolute inset-0 bg-linear-to-br from-background/40 via-background/20 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-t from-background/45 via-transparent to-background/10" />
          <div
            className="absolute inset-0 opacity-[0.55]"
            style={{
              background:
                "radial-gradient(ellipse 95% 70% at 18% 22%, rgba(255,243,224,0.28), transparent 52%), radial-gradient(ellipse 75% 55% at 92% 78%, rgba(63,63,70,0.08), transparent 48%)",
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_88%_78%_at_50%_42%,transparent_38%,rgba(15,23,42,0.14)_100%)] dark:bg-[radial-gradient(ellipse_88%_78%_at_50%_42%,transparent_38%,rgba(0,0,0,0.35)_100%)]" />
        </>
      )}
    </div>
  );
}
