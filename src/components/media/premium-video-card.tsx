"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import type { MediaVideo } from "@/data/types";
import { cn } from "@/lib/utils";

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function previewSrc(embedUrl: string) {
  const sep = embedUrl.includes("?") ? "&" : "?";
  return `${embedUrl}${sep}autoplay=1&mute=1&controls=0&playsinline=1`;
}

export function PremiumVideoCard({ v, snap, className }: { v: MediaVideo; snap?: boolean; className?: string }) {
  const [hoverPreview, setHoverPreview] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const onEnter = () => {
    clearTimer();
    timer.current = setTimeout(() => setHoverPreview(true), 400);
  };
  const onLeave = () => {
    clearTimer();
    setHoverPreview(false);
  };

  return (
    <motion.div
      className={cn(snap && "min-w-[min(88vw,320px)] shrink-0 snap-start sm:min-w-[340px]", className)}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
    >
      <Link
        href={`/media/video/${v.slug}`}
        className="group block"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_12px_40px_-16px_rgba(15,23,42,0.12)] transition duration-300 hover:border-primary/30 hover:shadow-[0_20px_48px_-20px_rgba(249,115,22,0.12)]">
          <div className="relative aspect-video overflow-hidden bg-black">
            <Image
              src={v.thumbnail}
              alt=""
              fill
              className={cn(
                "object-cover transition duration-700 ease-out",
                hoverPreview ? "scale-110 opacity-30" : "scale-100 opacity-100 group-hover:scale-105"
              )}
              sizes="(max-width:640px) 88vw, 340px"
            />
            {hoverPreview ? (
              <iframe
                title=""
                src={previewSrc(v.embedUrl)}
                className="pointer-events-none absolute inset-0 z-[1] h-full w-full scale-105 object-cover"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : null}
            <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black via-black/20 to-black/40" />
            <span className="absolute bottom-2 right-2 z-[3] rounded-md bg-black/75 px-2 py-0.5 font-mono text-[10px] font-medium text-white tabular-nums">
              {formatDuration(v.durationSec)}
            </span>
            {!hoverPreview ? (
              <span className="absolute left-3 top-3 z-[3] flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#c2410c] text-primary-foreground shadow-lg transition group-hover:scale-110 sm:h-11 sm:w-11">
                <Play className="ml-0.5 h-4 w-4 fill-current sm:h-5 sm:w-5" />
              </span>
            ) : null}
          </div>
          <div className="space-y-1.5 p-4">
            <p className="line-clamp-2 text-left text-sm font-semibold leading-snug text-foreground">{v.title}</p>
            <p className="text-left text-[11px] text-muted-foreground">
              {v.views.toLocaleString("en-IN")} views · {v.brandTag}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
