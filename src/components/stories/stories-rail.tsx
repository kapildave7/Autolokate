"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { articles } from "@/data";
import { RemoteImageWithFallback } from "@/components/ui/remote-image";

/** Instagram-style horizontal stories — editorial cards linking to articles. */
export function StoriesRail() {
  const picks = articles.slice(0, 12);
  return (
    <div className="relative">
      <div className="flex gap-4 overflow-x-auto pb-2 pt-1 [scrollbar-width:thin]">
        {picks.map((a) => (
          <Link
            key={a.slug}
            href={`/blog/${a.slug}`}
            className="group relative h-44 w-32 shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <RemoteImageWithFallback
              src={a.coverImage}
              alt=""
              fill
              className="object-cover transition duration-300 group-hover:scale-105"
              sizes="128px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-2 left-2 right-2">
              <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-white">{a.title}</p>
            </div>
            <span className="absolute right-2 top-2 rounded-full bg-card/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
              {a.category}
            </span>
          </Link>
        ))}
      </div>
      <Link
        href="/blog"
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        View all stories
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
