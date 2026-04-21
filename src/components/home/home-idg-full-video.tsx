"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  IDG_FEATURE_COPY,
  IDG_HOME_VIDEOS,
  INDIAN_DRIVE_GUIDE_CHANNEL_URL,
} from "@/lib/indian-drive-guide-youtube";
import { IndianDriveGuidePlayer } from "@/components/indian-drive-guide/indian-drive-guide-player";

/**
 * Full-width band: video fills behind content; height and padding keep badge + copy fully visible (not clipped).
 */
export function HomeIdgFullVideoBand() {
  return (
    <section className="relative z-1 w-full border-y border-border bg-secondary/35">
      <div className="relative mx-auto min-h-[min(42vh,420px)] w-full max-w-[1920px] sm:min-h-[min(40vh,400px)]">
        {/* Video only clipped; outer box can grow with content */}
        <div className="absolute inset-0 overflow-hidden">
          <IndianDriveGuidePlayer
            videoId={IDG_HOME_VIDEOS.driveGuideFeature}
            title="Indian Drive Guide — featured clip"
            autoplayWhenVisible
            layout="cover"
            className="h-full min-h-[280px]"
          />
        </div>

        <div
          className="pointer-events-none absolute inset-0 z-1 bg-linear-to-r from-background/78 via-background/52 to-background/28 sm:from-background/74 sm:via-background/48 sm:to-background/22"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-1 bg-linear-to-b from-background/22 via-transparent to-background/14"
          aria-hidden
        />

        <div className="relative z-10 mx-auto flex min-h-[min(42vh,420px)] max-w-7xl flex-col justify-center px-4 py-10 sm:min-h-[min(40vh,400px)] sm:px-6 sm:py-12 lg:px-8 lg:py-14">
          <Badge
            variant="outline"
            className="w-fit border-primary/40 bg-card/85 text-primary shadow-md backdrop-blur-md"
          >
            <Play className="mr-1 h-3 w-3 fill-current" />
            Indian Drive Guide · video
          </Badge>
          <h2 className="font-display mt-4 max-w-2xl text-2xl font-bold leading-tight tracking-tight text-foreground sm:mt-5 sm:text-3xl lg:text-[2rem]">
            {IDG_FEATURE_COPY.title}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/90 sm:mt-4 sm:max-w-2xl sm:text-base">
            {IDG_FEATURE_COPY.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-2 sm:mt-7 sm:gap-3">
            <Button asChild variant="default" size="sm" className="gap-2 sm:h-10 sm:px-5">
              <Link href={INDIAN_DRIVE_GUIDE_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                Subscribe on YouTube
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="border-border/90 bg-card/90 backdrop-blur-sm sm:h-10 sm:px-5" asChild>
              <Link href="/media">Media hub</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
