import Image from "next/image";
import { getBrandLogo, isRemoteBrandLogo } from "@/lib/brand-assets";

export function BrandLogo({
  brand,
  size = 22,
  variant = "square",
  className = "",
}: {
  brand: string;
  size?: number;
  variant?: "square" | "wordmark";
  className?: string;
}) {
  const src = getBrandLogo(brand);
  const fallback = brand
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  if (!src) {
    const width = variant === "wordmark" ? Math.round(size * 2.8) : size;
    const height = size;
    return (
      <span
        className={`inline-flex items-center justify-center rounded-lg border border-border bg-white text-[10px] font-semibold text-muted-foreground ${className}`}
        style={{ width, height }}
        aria-label={`${brand} logo`}
      >
        {variant === "wordmark" ? brand : fallback}
      </span>
    );
  }

  const width = variant === "wordmark" ? Math.round(size * 2.8) : size;
  const height = size;
  const remote = isRemoteBrandLogo(src);

  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden rounded-lg border border-border bg-white ${className}`}
      style={{ width, height }}
      aria-label={`${brand} logo`}
    >
      <Image
        src={src}
        alt={`${brand} logo`}
        fill
        className="object-contain p-1"
        sizes={`${Math.max(width, 24)}px`}
        unoptimized={remote}
      />
    </span>
  );
}
