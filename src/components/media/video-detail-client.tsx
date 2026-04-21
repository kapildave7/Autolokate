"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { ArrowLeft, Heart, Share2, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import type { MediaVideo } from "@/data/types";
import { videos } from "@/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { saveContinueVideo } from "@/lib/media-continue";

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function VideoDetailClient({ video }: { video: MediaVideo }) {
  useEffect(() => {
    saveContinueVideo({
      slug: video.slug,
      title: video.title,
      thumbnail: video.thumbnail,
    });
  }, [video.slug, video.title, video.thumbnail]);

  const suggested = videos.filter((v) => v.slug !== video.slug && v.brandTag === video.brandTag).slice(0, 8);
  const fallback = videos.filter((v) => v.slug !== video.slug).slice(0, 8);
  const side = suggested.length ? suggested : fallback;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/media"
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/80 px-4 py-2.5 text-sm font-medium text-primary transition hover:border-primary/30 hover:bg-secondary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Media
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="sticky top-20 space-y-4">
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-black shadow-xl shadow-foreground/15">
              <iframe
                title={video.title}
                src={video.embedUrl}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{video.brandTag}</Badge>
                <Badge variant="outline">{video.category}</Badge>
                <span className="text-xs text-muted-foreground">{formatDuration(video.durationSec)}</span>
              </div>
              <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">{video.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {video.views.toLocaleString("en-IN")} views · {video.publishedAt}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => toast.success("Liked")}
                  className="gap-2"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Like
                </Button>
                <Button
                  variant="outline"
                  className="border-primary/25"
                  type="button"
                  onClick={() => toast.success("Share sheet opened")}
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
                <Button variant="ghost" type="button" onClick={() => toast.message("Saved to watchlist")}>
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{video.description}</p>
              {video.sourceChannel && video.sourceChannelUrl ? (
                <p className="mt-4 text-xs text-muted-foreground">
                  Source:{" "}
                  <Link href={video.sourceChannelUrl} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                    {video.sourceChannel}
                  </Link>
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-2">
                <Badge variant="outline">{video.brandTag}</Badge>
                <Badge variant="outline">{video.category}</Badge>
                {video.sourceChannel ? (
                  <Badge variant="outline" className="border-brand-yellow-mid/40 text-brand-yellow-dark">
                    {video.sourceChannel}
                  </Badge>
                ) : null}
              </div>
            </motion.div>
          </div>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Suggested</h2>
          <div className="space-y-3">
            {side.map((v) => (
              <Link key={v.slug} href={`/media/video/${v.slug}`}>
                <Card className="overflow-hidden border-border bg-card transition hover:border-primary/30">
                  <CardContent className="flex gap-3 p-3">
                    <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg">
                      <Image src={v.thumbnail} alt="" fill className="object-cover" sizes="112px" unoptimized />
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-medium text-foreground">{v.title}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{v.views.toLocaleString("en-IN")} views</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
