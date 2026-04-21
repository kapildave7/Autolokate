"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { SeoBreadcrumbs } from "@/components/seo/breadcrumbs";
import { buildPathBreadcrumbs, shouldSuppressAutoBreadcrumb } from "@/lib/seo/path-breadcrumbs";

function isHomePath(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? pathname;
  const norm = path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;
  return norm === "" || norm === "/";
}

export function SitePathBreadcrumbs() {
  const pathname = usePathname() || "/";
  const items = useMemo(() => buildPathBreadcrumbs(pathname), [pathname]);

  if (isHomePath(pathname) || shouldSuppressAutoBreadcrumb(pathname) || items.length <= 1) {
    return null;
  }

  return (
    <div className="border-b border-border/50 bg-background/95 pt-2 backdrop-blur-[2px] sm:pt-2.5 mb-4 sm:mb-5 lg:mb-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SeoBreadcrumbs items={items} />
      </div>
    </div>
  );
}
