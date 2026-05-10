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
  if (pathname.startsWith("/admin")) return true;
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

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const minimal = isAuthLikePath(pathname);
  const adminPath = Boolean(pathname?.startsWith("/admin"));

  if (minimal) {
    return (
      <>
        {skipLink}
        <main
          id="main-content"
          className="relative z-1 min-h-screen min-w-0 flex-1 touch-manipulation"
        >
          {!adminPath ? <SitePathBreadcrumbs /> : null}
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
        className="relative min-h-0 min-w-0 flex-1 touch-manipulation pt-14 sm:pt-16"
      >
        <SitePathBreadcrumbs />
        {children}
      </main>
      <SiteFooter />
      <StickyCompareDock />
    </div>
  );
}
