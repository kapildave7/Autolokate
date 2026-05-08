"use client";

import Link from "next/link";
import { ArrowRight, FolderOpen, Play, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  IDG_FEATURE_COPY,
  IDG_HOME_VIDEOS,
  INDIAN_DRIVE_GUIDE_CHANNEL_URL,
} from "@/lib/indian-drive-guide-youtube";
import { IndianDriveGuidePlayer } from "@/components/indian-drive-guide/indian-drive-guide-player";
import { cn } from "@/lib/utils";

const headlinePrefix = "Indian Drive Guide";
const headlineEm = "real-world";
const headlineSuffix = "driving in India";

const paragraphs: [string, string] = [
  "Walkthroughs, road-safety explainers, maintenance checks, and everyday driving judgement — filmed for Indian roads and traffic.",
  "Every video on the official Indian Drive Guide channel helps you get practical context before you shortlist or book a test drive.",
];

/**
 * Two-column band: editorial copy on the left, framed video card on the right.
 * Theme-aware (uses --card / --foreground / --primary tokens).
 */
export function HomeIdgFullVideoBand() {
  return (
    <section className="relative z-1 border-y border-border/70 bg-background py-14 sm:py-16 lg:py-20">
      <div className="pointer-events-none absolute inset-0 -z-1 overflow-hidden" aria-hidden>
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/[0.08] blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-primary/[0.06] blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15">
              <Play className="h-3 w-3 fill-current" aria-hidden />
            </span>
            Indian Drive Guide · video
          </span>

          <h2
            className="font-display mt-6 text-balance text-3xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-[2.25rem] lg:text-[2.5rem]"
            aria-label={IDG_FEATURE_COPY.title}
          >
            {headlinePrefix}{" "}
            <span
              aria-hidden
              className={cn(
                "mx-1 inline-block h-[0.16em] w-[0.7em] translate-y-[-0.18em] rounded-full bg-primary align-middle",
                "sm:h-[0.18em] sm:w-[0.85em]"
              )}
            />
            <br />
            <span className="text-primary">{headlineEm}</span> {headlineSuffix}
          </h2>

          <div className="mt-5 max-w-xl space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
            <p>{paragraphs[0]}</p>
            <p>{paragraphs[1]}</p>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="primary" className="px-6">
              <Link
                href={INDIAN_DRIVE_GUIDE_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Youtube className="h-4 w-4" aria-hidden />
                Subscribe on YouTube
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-border/80 bg-card/70 px-6 backdrop-blur-md">
              <Link href="/media">
                <FolderOpen className="h-4 w-4" aria-hidden />
                Media hub
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative w-full">
          <div
            className="pointer-events-none absolute -inset-3 -z-1 rounded-[1.75rem] bg-primary/10 blur-2xl sm:-inset-4"
            aria-hidden
          />
          <div className="relative overflow-hidden rounded-[1.5rem] border border-border/80 bg-card p-1.5 shadow-hero-card ring-1 ring-foreground/[0.04]">
            <div className="overflow-hidden rounded-[1.15rem]">
              <IndianDriveGuidePlayer
                videoId={IDG_HOME_VIDEOS.driveGuideFeature}
                title="Indian Drive Guide — featured clip"
                autoplayWhenVisible
                layout="default"
              />
            </div>
            <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-black/55 px-3.5 py-2 text-white backdrop-blur-md sm:bottom-4 sm:px-4">
              <span className="inline-flex items-center gap-2 text-[12px] font-semibold sm:text-sm">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Play className="h-3 w-3 fill-current" aria-hidden />
                </span>
                Latest driving guide
              </span>
              <span className="text-[11px] font-medium tabular-nums text-white/85 sm:text-xs">12:48</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
