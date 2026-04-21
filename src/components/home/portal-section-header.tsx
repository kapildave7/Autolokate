import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PortalSectionHeader({
  eyebrow,
  title,
  subtitle,
  href,
  actionLabel,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  href?: string;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
        ) : null}
        <h2 className="font-display mt-1 text-[1.5rem] leading-tight text-foreground sm:text-3xl sm:leading-[1.15] lg:text-[2rem]">
          {title}
        </h2>
        {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">{subtitle}</p> : null}
      </div>
      {href && actionLabel ? (
        <Button variant="ghost" size="sm" className="shrink-0 self-start text-primary hover:text-primary sm:self-auto" asChild>
          <Link href={href}>
            {actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
