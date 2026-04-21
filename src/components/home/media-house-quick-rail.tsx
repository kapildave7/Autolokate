"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Newspaper, PlayCircle, Scale } from "lucide-react";
import type { ReactNode } from "react";
import { blogPosts, videos } from "@/data";
import { Card, CardContent } from "@/components/ui/card";

export function MediaHouseQuickRail() {
  const leadStory = blogPosts[0];
  const leadVideo = videos[0];

  return (
    <section className="sticky top-15 z-30 border-b border-border bg-white/92 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              Media Desk
            </span>
            <p className="text-xs text-muted-foreground sm:text-sm">
              News, reviews, videos, and comparison stories - curated for quick discovery.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Link href="/media/news" className="rounded-full border border-border bg-white px-3 py-1.5 hover:border-primary/35">
              News
            </Link>
            <Link href="/media/reviews" className="rounded-full border border-border bg-white px-3 py-1.5 hover:border-primary/35">
              Reviews
            </Link>
            <Link href="/media/comparison" className="rounded-full border border-border bg-white px-3 py-1.5 hover:border-primary/35">
              Comparison
            </Link>
          </div>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <FeatureCard
            href={leadStory ? `/blog/${leadStory.slug}` : "/blog"}
            icon={<Newspaper className="h-4 w-4" />}
            title={leadStory?.title ?? "Latest editorial story"}
            subtitle="Long read"
          />
          <FeatureCard
            href={leadVideo ? `/media/video/${leadVideo.slug}` : "/media"}
            icon={<PlayCircle className="h-4 w-4" />}
            title={leadVideo?.title ?? "Latest road test video"}
            subtitle="Watch now"
          />
          <FeatureCard href="/compare" icon={<Scale className="h-4 w-4" />} title="Compare cars and bikes side by side" subtitle="Decision lab" />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  href,
  title,
  subtitle,
  icon,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.18 }}>
      <Link href={href}>
        <Card className="border-border bg-white/90">
          <CardContent className="flex items-center gap-3 p-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
            <div className="min-w-0">
              <p className="line-clamp-1 text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
