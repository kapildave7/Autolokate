"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { videos } from "@/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function embedAutoplay(embedUrl: string) {
  const sep = embedUrl.includes("?") ? "&" : "?";
  return `${embedUrl}${sep}autoplay=1&mute=1&controls=0&playsinline=1&modestbranding=1`;
}

/**
 * Full-viewport-width muted hero video (same embed pattern as /media), Indian Drive Guide attribution.
 */
export function HomeDriveGuideRibbon() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const parallax = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);

  const heroVideo = useMemo(() => videos.find((v) => v.trending) ?? videos[0], []);

  if (!heroVideo) return null;

  return (
    <section
      ref={heroRef}
      className="relative w-full overflow-hidden border-y border-border bg-stone-950"
      aria-labelledby="home-drive-guide-heading"
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        <motion.div
          className="absolute -left-[18%] top-[8%] h-[70%] w-[55%] rounded-full bg-primary/20 blur-[100px]"
          animate={{ opacity: [0.12, 0.22, 0.12] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-[12%] bottom-[-8%] h-[65%] w-[50%] rounded-full bg-orange-500/18 blur-[90px]"
          animate={{ opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div style={{ y: parallax }} className="relative z-[1] min-h-[min(56vh,620px)] w-full">
        <iframe
          title={heroVideo.title}
          src={embedAutoplay(heroVideo.embedUrl)}
          className="absolute inset-0 z-[1] h-full w-full min-w-full scale-[1.12] border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
        <div className="media-hero-overlay absolute inset-0 z-[2]" />
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-r from-stone-950/55 via-transparent to-stone-950/40"
          aria-hidden
        />
      </motion.div>

      <div className="absolute inset-x-0 bottom-0 z-[3] mx-auto max-w-7xl px-4 pb-10 pt-20 sm:px-6 sm:pb-12 sm:pt-24 lg:px-8">
        <Badge className="border-primary/35 bg-primary/15 text-primary-foreground shadow-sm backdrop-blur-sm">
          <Sparkles className="mr-1 h-3 w-3" aria-hidden />
          Indian Drive Guide
        </Badge>
        <h2
          id="home-drive-guide-heading"
          className="font-display mt-4 max-w-3xl text-3xl font-bold tracking-tight text-white drop-shadow-[0_3px_28px_rgba(0,0,0,0.5)] sm:text-4xl lg:text-[2.75rem] lg:leading-tight"
        >
          See real roads, real traffic, real ownership — before you shortlist.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
          The same video library that powers our{" "}
          <Link href="/media" className="font-semibold text-primary-200 underline decoration-white/30 underline-offset-2 hover:decoration-primary-200">
            media hub
          </Link>
          : walkarounds, highway loops, and maintenance tips from{" "}
          <Link
            href="https://www.youtube.com/@IndianDriveGuide"
            className="font-semibold text-primary-200 underline decoration-white/30 underline-offset-2 hover:decoration-primary-200"
            target="_blank"
            rel="noopener noreferrer"
          >
            Indian Drive Guide
          </Link>
          .
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" className="gap-2 shadow-lg shadow-black/20" asChild>
            <Link href={`/media/video/${heroVideo.slug}`}>
              <Play className="h-4 w-4" />
              Play featured clip
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/15"
            asChild
          >
            <Link href="/media">
              Browse all media
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
