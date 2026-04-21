"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import { exteriorFallbackForKey } from "@/lib/fallback-images";

type Props = Omit<ImageProps, "src" | "alt"> & {
  src: string;
  alt: string;
  /** When the remote URL fails, swap to this (default: deterministic pick from listing photo pool). */
  fallbackSrc?: string;
};

/**
 * next/image with a single swap on error — avoids broken listing/blog heroes when a CDN 404s.
 */
export function RemoteImageWithFallback({
  src,
  alt,
  fallbackSrc,
  onError,
  ...props
}: Props) {
  const resolvedFallback = fallbackSrc ?? exteriorFallbackForKey(`${src}|${alt}`);
  const [current, setCurrent] = useState(src);

  useEffect(() => {
    setCurrent(src);
  }, [src]);

  return (
    <Image
      {...props}
      src={current}
      alt={alt}
      onError={(e) => {
        if (current !== resolvedFallback) setCurrent(resolvedFallback);
        onError?.(e);
      }}
    />
  );
}
