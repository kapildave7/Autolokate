"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { GA_CATEGORIES, trackEvent, trackPageView } from "@/lib/analytics";

const SCROLL_DEPTHS = [25, 50, 75, 100] as const;

/**
 * Requires Suspense boundary in layout (useSearchParams).
 */
export function GaPageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fullPath = useMemo(() => {
    const q = searchParams.toString();
    return q ? `${pathname}?${q}` : pathname;
  }, [pathname, searchParams]);

  const trackedDepths = useRef<Set<number>>(new Set());
  const scrollTicking = useRef(false);
  const visibleSince = useRef<number>(typeof performance !== "undefined" ? performance.now() : Date.now());
  const skipNextAutomaticPageView = useRef(true);

  useEffect(() => {
    trackedDepths.current = new Set();
    scrollTicking.current = false;
    visibleSince.current = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (skipNextAutomaticPageView.current) {
      skipNextAutomaticPageView.current = false;
    } else {
      trackPageView(fullPath);
    }
    trackEvent("route_view", {
      event_category: GA_CATEGORIES.engagement,
      event_action: "page",
      page_path: fullPath,
    });
  }, [fullPath]);

  useEffect(() => {
    function onScroll() {
      if (scrollTicking.current) return;
      scrollTicking.current = true;
      requestAnimationFrame(() => {
        scrollTicking.current = false;
        const doc = document.documentElement;
        const height = doc.scrollHeight - window.innerHeight;
        if (height <= 0) return;
        const pct = Math.round((window.scrollY / height) * 100);
        for (const depth of SCROLL_DEPTHS) {
          if (pct >= depth && !trackedDepths.current.has(depth)) {
            trackedDepths.current.add(depth);
            trackEvent("scroll_depth", {
              event_category: GA_CATEGORIES.engagement,
              event_action: "scroll",
              page_path: fullPath,
              percent_scrolled: depth,
            });
          }
        }
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [fullPath]);

  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "hidden") {
        const now = typeof performance !== "undefined" ? performance.now() : Date.now();
        const sec = Math.round((now - visibleSince.current) / 1000);
        if (sec >= 2) {
          trackEvent("page_time_visible", {
            event_category: GA_CATEGORIES.engagement,
            event_action: "visibility_hidden",
            page_path: fullPath,
            visible_seconds: sec,
          });
        }
      } else {
        visibleSince.current = typeof performance !== "undefined" ? performance.now() : Date.now();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [fullPath]);

  return null;
}
