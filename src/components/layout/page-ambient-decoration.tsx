"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

type AmbientTheme =
  | "home"
  | "cars"
  | "bikes"
  | "media"
  | "community"
  | "brands"
  | "compare"
  | "companies"
  | "commerce"
  | "default";

function themeForPath(pathname: string): AmbientTheme {
  if (pathname === "/" || pathname === "") return "home";
  if (pathname.startsWith("/cars") || pathname.startsWith("/used-cars") || pathname.startsWith("/new-cars"))
    return "cars";
  if (pathname.startsWith("/bikes")) return "bikes";
  if (pathname.startsWith("/media") || pathname.startsWith("/blog")) return "media";
  if (pathname.startsWith("/community")) return "community";
  if (pathname.startsWith("/brands")) return "brands";
  if (pathname.startsWith("/compare")) return "compare";
  if (pathname.startsWith("/companies")) return "companies";
  if (
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/sell") ||
    pathname.startsWith("/test-drive") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/dashboard")
  )
    return "commerce";
  return "default";
}

const stroke = "stroke-[rgba(82,82,91,0.32)]";
const strokeSoft = "stroke-[rgba(107,100,119,0.22)]";
const fillSoft = "fill-[rgba(63,63,70,0.08)]";

export function PageAmbientDecoration() {
  const pathname = usePathname() ?? "";
  const theme = useMemo(() => themeForPath(pathname), [pathname]);

  /* Book-expert uses its own full-page emerald dark canvas; skip global ambient. */
  if (pathname === "/book-expert") return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <svg
        className={cn(
          "ambient-svg absolute -right-[8%] top-[6%] h-[min(52vw,420px)] w-[min(92vw,640px)] max-md:top-[10%] max-md:h-[min(64vw,320px)]",
          theme === "media" && "text-zinc-500/75",
          theme === "cars" && "text-zinc-500/80",
          theme === "bikes" && "text-zinc-500/78",
          theme === "community" && "text-zinc-500/75",
          theme === "brands" && "text-zinc-500/82",
          theme === "compare" && "text-zinc-500/78",
          theme === "companies" && "text-muted-foreground/90",
          theme === "commerce" && "text-zinc-500/72",
          theme === "home" && "text-zinc-500/80",
          theme === "default" && "text-zinc-500/70"
        )}
        viewBox="0 0 400 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className="ambient-rotate-slow origin-[200px_160px]">
          <circle cx="200" cy="160" r="118" className={cn(strokeSoft, "ambient-dash")} strokeWidth="1.2" />
          <circle cx="200" cy="160" r="88" className={cn(stroke, "ambient-dash-reverse")} strokeWidth="1" opacity={0.55} />
        </g>

        {theme === "cars" || theme === "home" ? (
          <g className="ambient-slide-x">
            <path
              d="M40 220 L360 220 M56 236 L344 236 M72 252 L328 252"
              className={strokeSoft}
              strokeWidth="1"
              strokeLinecap="round"
              opacity={0.65}
            />
            <ellipse cx="118" cy="218" rx="22" ry="22" className={cn(stroke, fillSoft)} strokeWidth="1.2" />
            <ellipse cx="282" cy="218" rx="22" ry="22" className={cn(stroke, fillSoft)} strokeWidth="1.2" />
          </g>
        ) : null}

        {theme === "bikes" ? (
          <g className="ambient-spin-slow origin-[200px_200px]">
            <circle cx="130" cy="200" r="36" className={stroke} strokeWidth="1.2" opacity={0.7} />
            <circle cx="270" cy="200" r="36" className={stroke} strokeWidth="1.2" opacity={0.7} />
            <path d="M130 200 L200 140 L270 200 M200 140 L200 120" className={strokeSoft} strokeWidth="1.2" strokeLinecap="round" />
          </g>
        ) : null}

        {theme === "media" ? (
          <g className="ambient-wave">
            <path
              d="M32 180 Q100 120 168 180 T304 180 T400 180"
              className={stroke}
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
              opacity={0.55}
            />
            <path
              d="M32 210 Q120 250 208 210 T384 210"
              className={strokeSoft}
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
              opacity={0.5}
            />
          </g>
        ) : null}

        {theme === "community" ? (
          <g className="ambient-pulse-soft">
            <circle cx="130" cy="148" r="5" className={cn(stroke, fillSoft)} strokeWidth="1" />
            <circle cx="270" cy="138" r="5" className={cn(stroke, fillSoft)} strokeWidth="1" />
            <circle cx="200" cy="208" r="6" className={cn(stroke, fillSoft)} strokeWidth="1" />
            <path
              d="M130 148 L200 208 M270 138 L200 208 M130 148 L270 138"
              className={strokeSoft}
              strokeWidth="0.9"
              fill="none"
              strokeLinecap="round"
              opacity={0.65}
            />
          </g>
        ) : null}

        {theme === "compare" ? (
          <g className="ambient-pulse-soft">
            <rect x="96" y="120" width="88" height="140" rx="12" className={cn(stroke, fillSoft)} strokeWidth="1" />
            <rect x="216" y="120" width="88" height="140" rx="12" className={cn(stroke, fillSoft)} strokeWidth="1" />
          </g>
        ) : null}

        {theme === "brands" ? (
          <g className="ambient-rotate-slow origin-[200px_160px]">
            <polygon
              points="200,48 268,92 268,168 200,212 132,168 132,92"
              className={cn(stroke, fillSoft)}
              strokeWidth="1"
              opacity={0.65}
            />
          </g>
        ) : null}

        {theme === "companies" ? (
          <g className="ambient-slide-y">
            <path
              d="M120 200 L120 120 L200 88 L280 120 L280 200 Z"
              className={cn(strokeSoft, fillSoft)}
              strokeWidth="1"
              opacity={0.55}
            />
            <path d="M152 200 L152 148 M248 200 L248 148" className={stroke} strokeWidth="0.9" opacity={0.45} />
          </g>
        ) : null}

        {theme === "commerce" ? (
          <g className="ambient-pulse-soft">
            <circle cx="200" cy="160" r="6" className={fillSoft} stroke={stroke} strokeWidth="1" />
            <circle cx="160" cy="190" r="4" className={fillSoft} stroke={strokeSoft} strokeWidth="0.8" />
            <circle cx="240" cy="190" r="4" className={fillSoft} stroke={strokeSoft} strokeWidth="0.8" />
          </g>
        ) : null}

        {theme === "default" ? (
          <g className="ambient-drift">
            <circle cx="280" cy="100" r="48" className={fillSoft} opacity={0.9} />
            <circle cx="120" cy="200" r="36" className={fillSoft} opacity={0.75} />
          </g>
        ) : null}
      </svg>

      <svg
        className="ambient-svg absolute -left-[12%] bottom-[4%] h-[min(40vw,280px)] w-[min(70vw,420px)] opacity-80 max-md:bottom-[8%]"
        viewBox="0 0 320 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className="ambient-drift-reverse opacity-70">
          <path
            d="M0 240 C80 200 160 260 320 220"
            className="stroke-[rgba(167,139,250,0.2)]"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M0 260 C100 220 200 280 320 248"
            className="stroke-[rgba(214,211,209,0.45)]"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}
