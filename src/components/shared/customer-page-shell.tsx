"use client";

import { PageFade } from "@/components/shared/page-fade";
import { cn } from "@/lib/utils";

export function CustomerPageShell({
  eyebrow,
  title,
  lead,
  children,
  className,
  maxWidthClass = "max-w-7xl",
  contentClassName,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
  className?: string;
  maxWidthClass?: string;
  /** Extra classes on the inner content wrapper (below title/lead). */
  contentClassName?: string;
}) {
  const hasIntro = Boolean(eyebrow || lead);

  return (
    <PageFade>
      <div
        className={cn(
          "mx-auto px-4 py-12 sm:px-6 sm:py-16 lg:px-8",
          maxWidthClass,
          className
        )}
      >
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        ) : null}
        <h1
          className={cn(
            "text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.5rem]",
            eyebrow ? "mt-2" : ""
          )}
        >
          {title}
        </h1>
        {lead ? (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">{lead}</p>
        ) : null}
        <div className={cn(hasIntro ? "mt-10" : "mt-8", contentClassName)}>{children}</div>
      </div>
    </PageFade>
  );
}
