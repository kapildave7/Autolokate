"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PageAmbientDecoration } from "@/components/layout/page-ambient-decoration";
import { SitePathBreadcrumbs } from "@/components/layout/site-path-breadcrumbs";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { StickyCompareDock } from "@/components/layout/sticky-compare-dock";

function isAuthLikePath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === "/login") return true;
  return pathname.startsWith("/auth/");
}

const skipLink = (
  <a
    href="#main-content"
    className="sr-only z-999 rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground focus:not-sr-only focus:absolute focus:left-3 focus:top-3"
  >
    Skip to main content
  </a>
);

function isBookExpertPath(pathname: string | null): boolean {
  if (!pathname) return false;
  const norm = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  return norm === "/book-expert";
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const minimal = isAuthLikePath(pathname);
  const bookExpertPage = isBookExpertPath(pathname);

  if (minimal) {
    return (
      <>
        {skipLink}
        <main
          id="main-content"
          className="relative z-1 min-h-screen min-w-0 flex-1 touch-manipulation"
        >
          <SitePathBreadcrumbs />
          {children}
        </main>
      </>
    );
  }

  return (
    <div className="relative flex min-h-screen min-w-0 flex-col">
      <PageAmbientDecoration />
      {skipLink}
      <SiteHeader />
      <main
        id="main-content"
        className={cn(
          "relative min-h-0 min-w-0 flex-1 touch-manipulation pt-14 sm:pt-16",
          /* Same bg as book-expert page — avoids a light strip under the fixed header */
          bookExpertPage && "bg-[#050506] text-zinc-100"
        )}
      >
        <SitePathBreadcrumbs />
        {children}
      </main>
      <SiteFooter />
      <StickyCompareDock />
    </div>
  );
}
