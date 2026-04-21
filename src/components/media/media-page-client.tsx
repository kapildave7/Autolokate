"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Newspaper,
  Play,
  PlayCircle,
  Sparkles,
  Video,
} from "lucide-react";
import { articles, blogPosts, videos } from "@/data";
import type { MediaVideo } from "@/data/types";
import { RemoteImageWithFallback } from "@/components/ui/remote-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { PageFade } from "@/components/shared/page-fade";
import { readContinueVideo, type ContinueVideo } from "@/lib/media-continue";
import { exteriorFallbackForKey } from "@/lib/fallback-images";
import { youtubeNocookieEmbedSrc, INDIAN_DRIVE_GUIDE_CHANNEL_URL } from "@/lib/indian-drive-guide-youtube";

function embedVideoId(embedUrl: string): string {
  const m = embedUrl.match(/\/embed\/([^?&/]+)/);
  return m?.[1] ?? "";
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function hubCoverForCategory(cat: string) {
  return articles.find((a) => a.category === cat)?.coverImage ?? exteriorFallbackForKey(`media-hub-${cat}`);
}

function previewSrc(embedUrl: string) {
  const u = embedUrl.includes("?") ? `${embedUrl}&` : `${embedUrl}?`;
  return `${u}autoplay=1&mute=1&controls=0&playsinline=1&modestbranding=1`;
}

function VideoCard({ v, snap }: { v: MediaVideo; snap?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={snap ? "min-w-[min(88vw,300px)] snap-center sm:snap-start sm:min-w-[300px]" : ""}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link href={`/media/video/${v.slug}`} className="block">
        <Card className="group h-full overflow-hidden border-border/80 bg-card shadow-sm transition-shadow duration-300 hover:border-primary/25 hover:shadow-lg">
          <div className="relative aspect-video overflow-hidden bg-foreground">
            <Image
              src={v.thumbnail}
              alt={v.title}
              fill
              className={`object-cover transition duration-500 ease-out group-hover:scale-[1.04] motion-reduce:group-hover:scale-100 ${hover ? "opacity-0" : "opacity-100"}`}
              sizes="300px"
              unoptimized
            />
            {hover ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35 }}
                className="absolute inset-0 z-10"
              >
                <iframe
                  title=""
                  src={previewSrc(v.embedUrl)}
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </motion.div>
            ) : null}
            <div className="media-thumb-overlay absolute inset-0 z-[11] opacity-90" />
            <span className="absolute bottom-2 right-2 z-[12] rounded-md bg-black/75 px-2 py-0.5 font-mono text-[10px] text-white">
              {formatDuration(v.durationSec)}
            </span>
            <span className="absolute left-2 top-2 z-[12] flex h-9 w-9 items-center justify-center rounded-full bg-card text-foreground shadow-md ring-1 ring-border/30">
              <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
            </span>
          </div>
          <CardContent className="p-4">
            <Badge variant="outline" className="text-[10px] font-normal">
              {v.brandTag}
            </Badge>
            <p className="mt-2 line-clamp-2 text-sm font-semibold text-foreground">{v.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{v.views.toLocaleString("en-IN")} views</p>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function ContinueWatchingStrip() {
  const [item, setItem] = useState<ContinueVideo | null>(null);
  useEffect(() => {
    setItem(readContinueVideo());
  }, []);
  if (!item) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-10 rounded-2xl border border-border/80 bg-muted/50 p-4 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg border border-border">
            <Image src={item.thumbnail} alt={item.title} fill className="object-cover" sizes="96px" unoptimized />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Continue watching</p>
            <p className="line-clamp-2 text-sm font-semibold text-foreground">{item.title}</p>
          </div>
        </div>
        <Button size="sm" className="shrink-0 gap-2" asChild>
          <Link href={`/media/video/${item.slug}`}>
            <PlayCircle className="h-4 w-4" />
            Resume
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

export function MediaPageClient() {
  const idgVideos = videos.filter((v) => v.sourceChannel === "Indian Drive Guide");
  const catalogVideos = idgVideos.length ? idgVideos : videos;
  const heroVideo =
    catalogVideos.find((v) => v.trending) ?? catalogVideos[0] ?? videos[0];
  const heroVideoId = embedVideoId(heroVideo.embedUrl);
  const trendingVids = useMemo(
    () => [...catalogVideos].filter((v) => v.trending).slice(0, 12),
    [catalogVideos]
  );
  const railVideos = (trendingVids.length ? trendingVids : catalogVideos.slice(0, 12)).slice(0, 12);

  const newsArticles = useMemo(() => {
    const news = articles.filter((a) => a.category === "News");
    return (news.length ? news : articles).slice(0, 6);
  }, []);
  const latestArticles = useMemo(() => [...articles].slice(0, 24), []);
  const deskPosts = useMemo(() => blogPosts.slice(0, 10), []);

  const hubGateways = useMemo(
    () => [
      {
        href: "/media/news",
        label: "News",
        desc: "Launches, policy, and market moves",
        cover: hubCoverForCategory("News"),
        accent: "from-zinc-500/10 to-zinc-600/5 ring-zinc-500/15",
      },
      {
        href: "/media/reviews",
        label: "Reviews",
        desc: "Real-world tests and ownership notes",
        cover: hubCoverForCategory("Reviews"),
        accent: "from-warn-soft to-warn-soft/50 ring-warn-soft-foreground/20",
      },
      {
        href: "/media/comparison",
        label: "Comparisons",
        desc: "Side-by-side specs and verdicts",
        cover: hubCoverForCategory("Comparisons"),
        accent: "from-cta/30 to-primary/5 ring-cta-foreground/15",
      },
    ],
    []
  );

  const categories = ["Reviews", "Comparisons", "News", "Buying guides", "EV & Tech"];
  const ARTICLES_PER_PAGE = 8;
  const [articlesPage, setArticlesPage] = useState(1);
  const articlePageCount = Math.max(1, Math.ceil(latestArticles.length / ARTICLES_PER_PAGE));
  const articlePageSafe = Math.min(articlesPage, articlePageCount);
  const pagedArticles = latestArticles.slice(
    (articlePageSafe - 1) * ARTICLES_PER_PAGE,
    articlePageSafe * ARTICLES_PER_PAGE
  );

  function categoryHubHref(cat: string) {
    if (cat === "Reviews") return "/media/reviews";
    if (cat === "Comparisons") return "/media/comparison";
    if (cat === "News") return "/media/news";
    return `/blog?cat=${encodeURIComponent(cat)}`;
  }

  return (
    <PageFade>
      <section className="relative overflow-hidden border-b border-border/80 bg-linear-to-b from-secondary/50 via-card to-secondary/30">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-zinc-400/10 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-cta/25 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-14 lg:px-8 lg:py-20">
          <div>
            <Badge variant="outline" className="border-border bg-card/80 text-foreground">
              <Sparkles className="mr-1 h-3 w-3 text-zinc-600" />
              Autolokate Media
            </Badge>
            <h1 className="font-display mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
              Video, news &amp; long reads for Indian drivers.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Curated clips, desk reporting, and blog essays — one place to watch and read before you decide.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {articles.length} stories · {catalogVideos.length} videos · {blogPosts.length} blog posts
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              <Button asChild size="sm" className="rounded-full">
                <a href="#videos">
                  <Video className="mr-1.5 h-4 w-4" />
                  Videos
                </a>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-full border-border bg-card">
                <a href="#news">
                  <Newspaper className="mr-1.5 h-4 w-4" />
                  News
                </a>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-full border-border bg-card">
                <a href="#desk">
                  <BookOpen className="mr-1.5 h-4 w-4" />
                  Desk
                </a>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-full border-border bg-card">
                <a href="#blog">
                  Blog
                </a>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-border/90 bg-foreground shadow-2xl shadow-foreground/15 ring-1 ring-black/5">
              <div className="relative aspect-video w-full">
                <iframe
                  title={heroVideo.title}
                  src={youtubeNocookieEmbedSrc(heroVideoId, { autoplay: false, controls: 1 })}
                  className="absolute inset-0 h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Featured pick ·{" "}
              <Link
                href={INDIAN_DRIVE_GUIDE_CHANNEL_URL}
                className="font-medium text-foreground underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                More on YouTube
              </Link>
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <ContinueWatchingStrip />

        <ScrollReveal>
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Topics</p>
            <h2 className="font-display mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Explore by lane
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Jump into the hub that matches what you are researching today.
            </p>
          </div>
        </ScrollReveal>
        <div className="grid gap-5 sm:grid-cols-3">
          {hubGateways.map((g, i) => (
            <motion.div
              key={g.href}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
            >
              <Link href={g.href} className="group block h-full">
                <Card
                  className={`h-full overflow-hidden border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${g.accent} ring-1`}
                >
                  <div className="relative aspect-[16/11] overflow-hidden">
                    <RemoteImageWithFallback
                      src={g.cover}
                      alt=""
                      fill
                      className="object-cover transition duration-500 group-hover:scale-[1.04]"
                      sizes="(max-width:768px) 88vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-foreground/80 via-foreground/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-white/90">{g.label}</p>
                      <p className="mt-1 text-sm text-white/85">{g.desc}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-white">
                        Open
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <section id="videos" className="scroll-mt-24 mt-20">
          <ScrollReveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Watch</p>
                <h2 className="font-display mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Videos</h2>
                <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                  Clips and walkthroughs — open any tile for the full watch page.
                </p>
              </div>
              <Button variant="outline" size="sm" className="shrink-0 border-border" asChild>
                <Link href={INDIAN_DRIVE_GUIDE_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                  YouTube channel
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </ScrollReveal>
          <div className="mt-8 flex gap-5 overflow-x-auto overscroll-x-contain pb-4 [scrollbar-width:thin] snap-x snap-mandatory scroll-smooth">
            {railVideos.map((v) => (
              <VideoCard key={v.slug} v={v} snap />
            ))}
          </div>
        </section>

        <section id="news" className="scroll-mt-24 mt-20">
          <ScrollReveal>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">News desk</h2>
            <p className="mt-2 text-sm text-muted-foreground">Latest headlines from our reporting team.</p>
          </ScrollReveal>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {newsArticles.map((a, i) => (
              <motion.div
                key={a.slug}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 6) * 0.04 }}
              >
                <Link href={`/media/${a.slug}`} className="group block h-full">
                  <Card className="h-full overflow-hidden border-border/80 transition hover:border-primary/25 hover:shadow-md">
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <RemoteImageWithFallback
                        src={a.coverImage}
                        alt=""
                        fill
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width:768px) 100vw, 33vw"
                      />
                    </div>
                    <CardContent className="p-4">
                      <Badge variant="secondary" className="text-[10px]">
                        {a.category}
                      </Badge>
                      <p className="mt-2 line-clamp-2 font-semibold text-foreground">{a.title}</p>
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {a.readMins} min read
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Button variant="outline" asChild>
              <Link href="/media/news">All news</Link>
            </Button>
          </div>
        </section>

        <section id="desk" className="scroll-mt-24 mt-20">
          <ScrollReveal>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Latest from the desk</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Reviews, guides, and analysis — paginate to see more.
            </p>
          </ScrollReveal>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pagedArticles.map((a, i) => (
              <motion.div
                key={a.slug}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 8) * 0.03 }}
              >
                <Link href={`/media/${a.slug}`} className="group block h-full">
                  <Card className="h-full overflow-hidden border-border/80 transition hover:border-primary/25 hover:shadow-md">
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <RemoteImageWithFallback
                        src={a.coverImage}
                        alt=""
                        fill
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width:640px) 88vw, 25vw"
                      />
                    </div>
                    <CardContent className="p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{a.category}</p>
                      <p className="mt-2 line-clamp-2 text-sm font-semibold text-foreground">{a.title}</p>
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {a.readMins} min
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
          {articlePageCount > 1 ? (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={articlePageSafe <= 1}
                onClick={() => setArticlesPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                Page {articlePageSafe} / {articlePageCount}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={articlePageSafe >= articlePageCount}
                onClick={() => setArticlesPage((p) => Math.min(articlePageCount, p + 1))}
              >
                Next
              </Button>
            </div>
          ) : null}
        </section>

        <section id="blog" className="scroll-mt-24 mt-20">
          <ScrollReveal>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">From the blog</h2>
            <p className="mt-2 text-sm text-muted-foreground">Essays and deep dives on the blog.</p>
          </ScrollReveal>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {deskPosts.map((s) => (
              <Link key={s.slug} href={`/blog/${s.slug}`}>
                <Card className="h-full overflow-hidden border-border/80 transition hover:border-primary/25 hover:shadow-md">
                  <CardContent className="flex gap-4 p-5">
                    <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <RemoteImageWithFallback src={s.coverImage} alt="" fill className="object-cover" sizes="128px" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase text-primary">{s.category}</p>
                      <p className="mt-1 font-semibold leading-snug text-foreground">{s.title}</p>
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{s.excerpt}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{s.readMins} min read</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="mt-6">
            <Button variant="outline" asChild>
              <Link href="/blog">
                View all posts
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <ScrollReveal delay={0.04}>
          <h2 className="font-display mt-20 text-xl font-bold tracking-tight sm:text-2xl">Browse by category</h2>
        </ScrollReveal>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link key={c} href={categoryHubHref(c)}>
              <Badge
                variant="secondary"
                className="cursor-pointer border border-border/80 px-3 py-1.5 text-sm transition hover:border-primary/30 hover:bg-secondary/80"
              >
                {c}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </PageFade>
  );
}
