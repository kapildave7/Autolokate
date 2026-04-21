"use client";

import Link from "next/link";
import { blogPosts } from "@/data";

export function TopStoriesTicker() {
  const stories = blogPosts.slice(0, 8);
  const items = [...stories, ...stories];

  return (
    <section className="border-b border-border bg-white py-2 text-foreground">
      <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-hidden px-4 sm:px-6 lg:px-8">
        <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
          Top stories
        </span>
        <div className="ticker-track whitespace-nowrap">
          {items.map((s, i) => (
            <Link key={`${s.slug}-${i}`} href={`/blog/${s.slug}`} className="mr-8 text-xs text-foreground/80 hover:text-foreground sm:text-sm">
              {s.title}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
