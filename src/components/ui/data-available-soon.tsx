"use client";

import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Minimum height so layout doesn’t collapse when content is blurred */
  minHeight?: string;
  /** Softer blur + badge for large hero blocks */
  variant?: "default" | "soft";
  /**
   * Section name shown to users, e.g. “Gallery” → “Gallery will be available soon”.
   * If omitted, falls back to “This content will be available soon”.
   */
  sectionLabel?: string;
  /** Smaller type for tight cards (e.g. variant price row). */
  compact?: boolean;
};

/**
 * Non-interactive overlay for missing API data — keeps layout, blurs content, shows copy.
 * Parent must be `relative overflow-hidden`.
 */
export function DataAvailableSoonOverlay({
  className,
  minHeight = "min-h-[120px]",
  variant = "default",
  sectionLabel,
  compact = false,
}: Props) {
  const soft = variant === "soft";
  const label = sectionLabel?.trim() || "This content";
  const message = `${label} will be available soon`;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] px-2",
        minHeight,
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div
        className={cn(
          "absolute inset-0 backdrop-blur-[6px]",
          soft ? "bg-white/45" : "bg-[#F7F8FA]/55"
        )}
      />
      <p
        className={cn(
          "relative z-[1] max-w-[min(100%,22rem)] text-center shadow-sm",
          compact ? "text-xs leading-snug sm:text-sm" : "text-sm sm:text-base",
          soft
            ? "rounded-2xl border border-[#1E3A8A]/10 bg-white/90 px-4 py-2.5 font-semibold text-[#1E3A8A] ring-1 ring-[#1E3A8A]/5 sm:px-5 sm:py-3"
            : "rounded-lg border border-[#E5E7EB] bg-white/95 px-3 py-2 font-semibold text-[#111827] sm:px-4 sm:py-2.5"
        )}
      >
        {message}
      </p>
    </div>
  );
}
