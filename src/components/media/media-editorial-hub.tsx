"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Clock, Sparkles } from "lucide-react";
import { useMemo } from "react";
import type { ArticleDoc } from "@/data/types";
import { cars } from "@/data";
import { RemoteImageWithFallback } from "@/components/ui/remote-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageFade } from "@/components/shared/page-fade";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { exteriorFallbackForKey } from "@/lib/fallback-images";

const variantStyles = {
  comparison: {
    glow: "from-primary/12 via-warn-soft/40 to-transparent",
    badge: "border-primary/30 bg-primary/10 text-primary",
    accent: "text-primary",
    orbA: "bg-primary/15",
    orbB: "bg-warn-soft/60",
  },
  reviews: {
    glow: "from-warn-soft via-cta/20 to-transparent",
    badge: "border-warn-soft-foreground/25 bg-warn-soft text-warn-soft-foreground",
    accent: "text-warn-soft-foreground",
    orbA: "bg-warn-soft/80",
    orbB: "bg-cta/30",
  },
  news: {
    glow: "from-primary/14 via-primary/5 to-transparent",
    badge: "border-primary/30 bg-secondary text-primary",
    accent: "text-primary",
    orbA: "bg-primary/12",
    orbB: "bg-primary/8",
  },
} as const;

export type MediaHubVariant = keyof typeof variantStyles;

export function MediaEditorialHub({
  variant,
  title,
  subtitle,
  posts,
  secondaryCta,
}: {
  variant: MediaHubVariant;
  title: string;
  subtitle: string;
  posts: ArticleDoc[];
  secondaryCta?: { href: string; label: string };
}) {
  const v = variantStyles[variant];
  const heroCars = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const c of cars) {
      const u = c.images?.[0];
      if (u && !seen.has(u)) {
        seen.add(u);
        out.push(u);
        if (out.length >= 5) break;
      }
    }
    for (let i = 0; out.length < 5 && i < 24; i++) {
      const u = exteriorFallbackForKey(`hub-${variant}-hero-${i}`);
      if (!seen.has(u)) {
        seen.add(u);
        out.push(u);
      }
    }
    return out.slice(0, 5);
  }, [variant]);

  return (
    <PageFade>
      <div className="relative overflow-hidden border-b border-border bg-background">
        <div className="pointer-events-none absolute inset-0">
          <div className={`absolute inset-0 bg-gradient-to-br ${v.glow}`} />
          <motion.div
            className={`absolute -left-[10%] top-[20%] h-[70%] w-[50%] rounded-full ${v.orbA} blur-[100px]`}
            animate={{ opacity: [0.15, 0.28, 0.15], scale: [1, 1.05, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className={`absolute -right-[5%] bottom-0 h-[60%] w-[45%] rounded-full ${v.orbB} blur-[90px]`}
            animate={{ opacity: [0.12, 0.22, 0.12] }}
            transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-20 lg:pt-10">
          <Link
            href="/media"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground shadow-sm transition hover:border-primary/30 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Media
          </Link>

          <div className="mt-10 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Badge className={v.badge}>
                <Sparkles className="mr-1 h-3 w-3" />
                Autolokate editorial
              </Badge>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">{title}</h1>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">{subtitle}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {secondaryCta ? (
                  <Button className="gap-2" asChild>
                    <Link href={secondaryCta.href}>
                      {secondaryCta.label}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
                <Button variant="outline" className="border-border bg-card" asChild>
                  <Link href="/blog">Full story desk</Link>
                </Button>
              </div>
            </div>

            <div className="flex shrink-0 gap-2 sm:gap-3">
              {heroCars.slice(0, 4).map((src, i) => (
                <motion.div
                  key={`${src}-${i}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="relative h-24 w-36 overflow-hidden rounded-2xl border border-border shadow-md sm:h-28 sm:w-40"
                  style={{ rotate: `${(i - 1.5) * 2.5}deg` }}
                >
                  <RemoteImageWithFallback src={src} alt="" fill className="object-cover" sizes="160px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <ScrollReveal>
          <p className={`text-xs font-bold uppercase tracking-[0.2em] ${v.accent}`}>
            {posts.length} stor{posts.length === 1 ? "y" : "ies"}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">Latest in this hub</h2>
        </ScrollReveal>

        {posts.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">No articles in this category yet.</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p, i) => (
              <motion.div
                key={p.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link href={`/media/${p.slug}`} className="group block h-full">
                  <Card className="h-full overflow-hidden border-border bg-card shadow-premium transition-all duration-500 hover:border-primary/30 hover:shadow-[0_20px_48px_-24px_rgba(249,115,22,0.1)]">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <RemoteImageWithFallback
                        src={p.coverImage}
                        alt=""
                        fill
                        className="object-cover transition duration-700 ease-out group-hover:scale-[1.05]"
                        sizes="(max-width:768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-90" />
                      <Badge variant="secondary" className="absolute left-3 top-3 border border-border bg-white/95 text-[10px] text-foreground shadow-sm">
                        {p.category}
                      </Badge>
                    </div>
                    <CardContent className="p-5">
                      <p className="line-clamp-2 text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
                        {p.title}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.excerpt}</p>
                      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {p.readMins} min read · {p.publishedAt}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageFade>
  );
}
