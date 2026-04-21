"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import { youtubeNocookieEmbedSrc } from "@/lib/indian-drive-guide-youtube";

type IndianDriveGuidePlayerProps = {
  videoId: string;
  title: string;
  /** When true, starts muted autoplay once the frame scrolls into view (respects reduced motion). */
  autoplayWhenVisible?: boolean;
  className?: string;
  iframeClassName?: string;
  /**
   * default — 16:9 box (aspect-video).
   * cover — fills parent height; parent must set explicit height. Centers & crops like object-cover.
   * compact — fixed-height strip with cover crop for dense layouts (e.g. listing detail).
   */
  layout?: "default" | "cover" | "compact";
};

export function IndianDriveGuidePlayer({
  videoId,
  title,
  autoplayWhenVisible = true,
  className,
  iframeClassName,
  layout = "default",
}: IndianDriveGuidePlayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!autoplayWhenVisible || reduceMotion) {
      setInView(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setInView(true);
      },
      { threshold: 0.28, rootMargin: "0px 0px -8% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [autoplayWhenVisible, reduceMotion]);

  const autoplay = Boolean(inView && !reduceMotion && autoplayWhenVisible);

  const iframeBase =
    "border-0 [contain:strict] pointer-events-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  if (layout === "cover") {
    return (
      <div ref={ref} className={cn("relative h-full min-h-[200px] w-full overflow-hidden bg-black", className)}>
        <iframe
          title={title}
          src={youtubeNocookieEmbedSrc(videoId, { autoplay, controls: 1 })}
          className={cn(
            "absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 sm:min-w-[105%]",
            iframeBase,
            iframeClassName
          )}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  if (layout === "compact") {
    return (
      <div
        ref={ref}
        className={cn("relative h-[200px] w-full min-w-0 max-w-full overflow-hidden rounded-xl bg-black sm:h-[268px]", className)}
      >
        <iframe
          title={title}
          src={youtubeNocookieEmbedSrc(videoId, { autoplay, controls: 1 })}
          className={cn(
            "absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2",
            iframeBase,
            iframeClassName
          )}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("relative aspect-video w-full overflow-hidden bg-black", className)}>
      <iframe
        title={title}
        src={youtubeNocookieEmbedSrc(videoId, { autoplay, controls: 1 })}
        className={cn("absolute inset-0 h-full w-full", iframeBase, iframeClassName)}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
