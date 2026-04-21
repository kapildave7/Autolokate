import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { JsonLdScript, breadcrumbJsonLd } from "./json-ld";

export type Crumb = { name: string; href?: string };

type SeoBreadcrumbsProps = {
  items: Crumb[];
  /** Extra classes on the `<nav>` (default includes comfortable vertical padding everywhere). */
  className?: string;
};

/** Inactive crumbs = muted gray; current page = near-black. No hover affordances. Isolated from parent `text-white`. */
export function SeoBreadcrumbs({ items, className }: SeoBreadcrumbsProps) {
  if (!items || items.length <= 1) {
    return null;
  }

  const forLd = items
    .filter((c): c is Crumb & { href: string } => Boolean(c.href))
    .map((c) => ({ name: c.name, href: c.href! }));

  const linkInactive =
    "font-medium text-neutral-400! underline-offset-2 dark:text-neutral-500!";
  const currentPage = "breadcrumb-active-text font-semibold tracking-tight";
  const inactivePlain = "breadcrumb-inactive-text font-medium text-neutral-400! dark:text-neutral-500!";

  return (
    <>
      {forLd.length > 0 ? <JsonLdScript data={breadcrumbJsonLd(forLd)} /> : null}
      <nav
        aria-label="Breadcrumb"
        className={cn(
          "site-breadcrumb-nav isolate w-full min-w-0 py-4 sm:py-4 md:py-5",
          className
        )}
      >
        <ol className="flex max-w-full flex-wrap items-center gap-x-1 gap-y-1 text-[11px] leading-snug sm:gap-x-1.5 sm:text-xs md:text-[13px]">
          {items.map((c, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={`${c.name}-${i}`} className="flex min-w-0 max-w-full items-center gap-x-1 sm:gap-x-1.5">
                {i > 0 ? (
                  <ChevronRight
                    className="h-3 w-3 shrink-0 opacity-60 sm:h-3.5 sm:w-3.5"
                    aria-hidden
                  />
                ) : null}
                {c.href && !isLast ? (
                  <Link
                    href={c.href}
                    className={cn(
                      "inline-flex max-w-[min(100%,18rem)] items-center gap-1 rounded-sm px-0.5 py-0.5 sm:max-w-[min(100%,24rem)]",
                      linkInactive
                    )}
                  >
                    {i === 0 ? (
                      <>
                        <Home className="h-3 w-3 shrink-0 opacity-80 sm:h-3.5 sm:w-3.5" aria-hidden />
                        <span className="truncate">{c.name}</span>
                      </>
                    ) : (
                      <span className="truncate">{c.name}</span>
                    )}
                  </Link>
                ) : isLast ? (
                  <span
                    className={cn("line-clamp-2 max-w-[min(100%,min(100vw-2rem,42rem))] px-0.5 py-0.5", currentPage)}
                    aria-current="page"
                  >
                    {c.name}
                  </span>
                ) : (
                  <span className={cn("truncate px-0.5 py-0.5", inactivePlain)}>{c.name}</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
