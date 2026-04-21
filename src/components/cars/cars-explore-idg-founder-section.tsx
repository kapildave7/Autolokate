import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  IDG_FOUNDER,
  INDIAN_DRIVE_GUIDE_CHANNEL_URL,
} from "@/lib/indian-drive-guide-youtube";

export function CarsExploreIdgFounderSection() {
  return (
    <section
      className="relative border-b border-border/80 bg-linear-to-br from-zinc-500/[0.05] via-card to-zinc-400/[0.06] py-10 sm:py-14"
      aria-labelledby="idg-founder-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 100% 0%, rgba(63,63,70,0.1), transparent 55%), radial-gradient(ellipse 70% 50% at 0% 100%, rgba(82,82,91,0.08), transparent 50%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[1.65rem] border border-border/70 bg-card/90 shadow-[0_24px_64px_-32px_rgba(24,24,27,0.12),0_16px_40px_-28px_rgba(15,23,42,0.12)] ring-1 ring-foreground/[0.04] backdrop-blur-sm sm:rounded-[1.85rem]">
          <div className="grid gap-8 p-6 sm:gap-10 sm:p-8 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-12 lg:p-10">
            <div className="flex justify-center lg:justify-start">
              <div className="relative">
                <div
                  className="absolute -inset-1 rounded-full bg-linear-to-br from-zinc-400/15 via-zinc-300/12 to-zinc-500/18 opacity-90 blur-md"
                  aria-hidden
                />
                <div className="relative overflow-hidden rounded-full border border-primary/25 bg-zinc-900 shadow-lg ring-1 ring-border/50">
                  <Image
                    src={IDG_FOUNDER.avatarUrl}
                    alt={`${IDG_FOUNDER.name}, ${IDG_FOUNDER.title}`}
                    width={200}
                    height={200}
                    className="aspect-square h-36 w-36 rounded-full object-cover object-center sm:h-44 sm:w-44"
                    sizes="(max-width: 640px) 144px, 176px"
                    priority={false}
                  />
                </div>
                <span className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary shadow-sm">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  IDG
                </span>
              </div>
            </div>

            <div className="min-w-0 text-center lg:text-left">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-400">
                Indian Drive Guide
              </p>
              <h2
                id="idg-founder-heading"
                className="font-display mt-2 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
              >
                Meet the voice behind the videos
              </h2>
              <p className="mt-1 text-lg font-semibold text-foreground sm:text-xl">{IDG_FOUNDER.name}</p>
              <p className="text-sm font-medium text-primary">{IDG_FOUNDER.title}</p>
              <p className="mx-auto mt-4 max-w-prose text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem] lg:mx-0">
                {IDG_FOUNDER.bio}
              </p>
              <p className="mx-auto mt-4 max-w-prose text-pretty text-xs leading-relaxed text-muted-foreground sm:text-sm lg:mx-0">
                On Autolokate Explore, we point you to the same channel for calm, practical context on Indian roads —
                before you shortlist, compare, or book a test drive.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
                <Button
                  className="h-11 gap-2 rounded-xl bg-linear-to-r from-zinc-800 to-zinc-900 text-zinc-50 shadow-md hover:opacity-95"
                  asChild
                >
                  <Link href={INDIAN_DRIVE_GUIDE_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                    <Play className="h-4 w-4 fill-current" aria-hidden />
                    Watch on YouTube
                    <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden />
                  </Link>
                </Button>
                <Button variant="outline" className="h-11 rounded-xl border-border/80" asChild>
                  <Link href="/media">Browse media on Autolokate</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
