"use client";

import { RemoteImageWithFallback } from "@/components/ui/remote-image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { articles } from "@/data";
import type { ArticleDoc } from "@/data/types";
import { SeoBreadcrumbs } from "@/components/seo/breadcrumbs";

function bodyClass(t: string) {
  if (t === "h2") return "mt-12 scroll-mt-28 text-2xl font-bold text-foreground first:mt-0";
  if (t === "h3") return "mt-8 scroll-mt-28 text-xl font-semibold text-foreground";
  return "mt-5 text-base leading-relaxed text-muted-foreground";
}

export function ArticlePremium({
  post,
  breadcrumbRoot,
}: {
  post: ArticleDoc;
  /** Default: Stories → /blog. Media hub uses Media → /media. */
  breadcrumbRoot?: { href: string; label: string };
}) {
  const root = breadcrumbRoot ?? { href: "/blog", label: "Stories" };
  const storyHref = (slug: string) => (root.href === "/media" ? `/media/${slug}` : `/blog/${slug}`);
  let headingIdx = 0;
  const related = post.relatedSlugs
    .map((s) => articles.find((a) => a.slug === s))
    .filter((a): a is ArticleDoc => Boolean(a));

  return (
    <article className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {root.href === "/media" ? (
        <Link
          href="/media"
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/80 px-4 py-2.5 text-sm font-medium text-primary transition hover:border-primary/30 hover:bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Media hub
        </Link>
      ) : null}
      <SeoBreadcrumbs
        items={[{ name: "Home", href: "/" }, { name: root.label, href: root.href }, { name: post.title }]}
      />
      <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-12">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{post.category}</p>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
            {post.title}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            {post.author} · {post.publishedAt} · {post.readMins} min read
          </p>
          <div className="relative mt-10 aspect-[21/9] overflow-hidden rounded-3xl border border-border">
            <RemoteImageWithFallback src={post.coverImage} alt="" fill className="object-cover" priority sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <Badge key={t} variant="outline" className="border-primary/25">
                {t}
              </Badge>
            ))}
          </div>
          <Separator className="my-10" />

          <div className="prose prose-slate max-w-none">
            {post.sections.map((s, i) => {
              if (s.type === "h2" || s.type === "h3") {
                const id = post.toc[headingIdx]?.id ?? `h-${i}`;
                headingIdx += 1;
                const cls = bodyClass(s.type);
                return s.type === "h2" ? (
                  <h2 key={i} id={id} className={cls}>
                    {s.text}
                  </h2>
                ) : (
                  <h3 key={i} id={id} className={cls}>
                    {s.text}
                  </h3>
                );
              }
              return (
                <p key={i} className={bodyClass("p")}>
                  {s.text}
                </p>
              );
            })}
          </div>

          {post.inlineImages?.length ? (
            <div className="mt-12 grid gap-8 sm:grid-cols-2">
              {post.inlineImages.map((im, i) => (
                <motion.figure
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="overflow-hidden rounded-2xl border border-border"
                >
                  <div className="relative aspect-[4/3]">
                    <RemoteImageWithFallback src={im.src} alt={im.alt} fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
                  </div>
                  <figcaption className="p-3 text-xs text-muted-foreground">{im.caption}</figcaption>
                </motion.figure>
              ))}
            </div>
          ) : null}
        </div>

        <aside className="mt-12 lg:mt-0">
          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">On this page</p>
            <nav className="mt-4 space-y-2 border-l border-border pl-4">
              {post.toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block text-sm text-muted-foreground transition hover:text-primary"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <Card className="mt-8 border-border bg-card">
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Keep reading</p>
                <ul className="mt-3 space-y-2">
                  {related.slice(0, 4).map((r) => (
                    <li key={r.slug}>
                      <Link href={storyHref(r.slug)} className="text-sm text-primary hover:underline">
                        {r.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

      <section className="mt-20 border-t border-border pt-12">
        <h2 className="text-xl font-bold text-foreground">Related on Autolokate</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((r) => (
            <Link key={r.slug} href={storyHref(r.slug)}>
              <Card className="h-full overflow-hidden border-border bg-card transition hover:border-primary/30">
                <div className="relative aspect-video">
                  <RemoteImageWithFallback src={r.coverImage} alt="" fill className="object-cover" sizes="33vw" />
                </div>
                <CardContent className="p-4">
                  <p className="line-clamp-2 font-semibold text-foreground">{r.title}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{r.readMins} min</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
