"use client";

import { RemoteImageWithFallback } from "@/components/ui/remote-image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Clock, Search, Sparkles } from "lucide-react";
import { articles } from "@/data";
import { PageFade } from "@/components/shared/page-fade";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const PER_PAGE = 9;

export function BlogExplore() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const categories = useMemo(
    () => [...new Set(articles.map((a) => a.category))].sort(),
    []
  );

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (cat && a.category !== cat) return false;
      if (!q.trim()) return true;
      const qq = q.toLowerCase();
      return (
        a.title.toLowerCase().includes(qq) ||
        a.excerpt.toLowerCase().includes(qq) ||
        a.tags.some((t) => t.toLowerCase().includes(qq))
      );
    });
  }, [q, cat]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice((pageSafe - 1) * PER_PAGE, pageSafe * PER_PAGE);
  const featured = filtered[0];
  const gridRest = featured ? paged.filter((a) => a.slug !== featured.slug) : paged;

  return (
    <PageFade>
      <div className="min-h-screen bg-background">
        <section className="border-b border-border bg-hero-mesh">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="flex flex-wrap items-center gap-2 text-primary">
              <BookOpen className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Editorial desk</span>
            </div>
            <h1 className="font-display mt-4 max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Stories &amp; buying intelligence
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Guides, reviews, and comparisons — structured for search and calm reading. Same plum &amp; teal accents
              as the rest of Autolokate.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 border-t border-border/60 pt-8">
              <div className="rounded-2xl border border-border bg-card px-5 py-3 shadow-sm">
                <p className="text-2xl font-bold tabular-nums text-foreground">{articles.length}</p>
                <p className="text-xs font-medium text-muted-foreground">Articles</p>
              </div>
              <div className="rounded-2xl border border-border bg-card px-5 py-3 shadow-sm">
                <p className="text-2xl font-bold tabular-nums text-foreground">{categories.length}</p>
                <p className="text-xs font-medium text-muted-foreground">Topics</p>
              </div>
              <div className="rounded-2xl border border-border bg-card px-5 py-3 shadow-sm">
                <p className="text-2xl font-bold tabular-nums text-foreground">{filtered.length}</p>
                <p className="text-xs font-medium text-muted-foreground">Showing</p>
              </div>
            </div>
            <div className="relative mt-10 max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search models, cities, EV, finance…"
                className="h-11 border-border bg-card pl-10 shadow-sm"
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setCat(null);
                  setPage(1);
                }}
                className={cn(
                  "rounded-full border px-4 py-2 text-xs font-semibold transition",
                  cat == null
                    ? "border-primary/35 bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:border-primary/25 hover:text-foreground"
                )}
              >
                All stories
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCat(c === cat ? null : c);
                    setPage(1);
                  }}
                  className={cn(
                    "rounded-full border px-4 py-2 text-xs font-semibold transition",
                    cat === c
                      ? "border-primary/35 bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:border-primary/25 hover:text-foreground"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          {featured && pageSafe === 1 && !q.trim() && !cat && filtered.length > 1 ? (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="mb-12"
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Featured</p>
              <Link href={`/blog/${featured.slug}`} className="group mt-3 block">
                <Card className="overflow-hidden border-border bg-card shadow-premium transition hover:border-primary/25">
                  <div className="grid gap-0 lg:grid-cols-2">
                    <div className="relative aspect-[16/11] min-h-[220px] lg:aspect-auto lg:min-h-[320px]">
                      <RemoteImageWithFallback
                        src={featured.coverImage}
                        alt=""
                        fill
                        className="object-cover transition duration-500 group-hover:scale-[1.02]"
                        sizes="(max-width:1024px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-background/90 via-background/20 to-transparent lg:bg-linear-to-r" />
                      <Badge className="absolute left-4 top-4 border-primary/20 bg-primary/90 text-primary-foreground">
                        {featured.category}
                      </Badge>
                    </div>
                    <CardContent className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {featured.readMins} min · {featured.author}
                      </div>
                      <h2 className="font-display mt-3 text-2xl font-bold tracking-tight text-foreground group-hover:text-primary sm:text-3xl">
                        {featured.title}
                      </h2>
                      <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                        {featured.excerpt}
                      </p>
                      <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                        Read story
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </span>
                    </CardContent>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ) : null}

          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Library</p>
              <h2 className="font-display mt-1 text-2xl font-bold text-foreground sm:text-3xl">All articles</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {filtered.length} result{filtered.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(pageSafe === 1 && !q.trim() && !cat && filtered.length > 1 ? gridRest : paged).map((a, i) => (
              <motion.div
                key={a.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 12) * 0.03 }}
              >
                <Link href={`/blog/${a.slug}`} className="group block h-full">
                  <Card className="flex h-full flex-col overflow-hidden border-border bg-card shadow-sm transition hover:border-primary/25 hover:shadow-premium">
                    <div className="relative aspect-[5/4] overflow-hidden">
                      <RemoteImageWithFallback
                        src={a.coverImage}
                        alt=""
                        fill
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width:768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-background/85 via-transparent to-transparent" />
                      <Badge
                        variant="secondary"
                        className="absolute left-3 top-3 border-border/80 bg-background/90 text-[10px] backdrop-blur-sm"
                      >
                        {a.category}
                      </Badge>
                    </div>
                    <CardContent className="flex flex-1 flex-col p-5">
                      <p className="line-clamp-2 font-display text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
                        {a.title}
                      </p>
                      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                        {a.excerpt}
                      </p>
                      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Sparkles className="h-3 w-3 text-primary" />
                        {a.author} · {a.readMins} min
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-border"
                disabled={pageSafe <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
                Page {pageSafe} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="border-border"
                disabled={pageSafe >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </PageFade>
  );
}
