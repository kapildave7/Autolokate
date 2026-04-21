import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Car } from "@/data/types";
import { cn } from "@/lib/utils";

const tray =
  "flex flex-wrap gap-1.5 rounded-xl border border-white/30 bg-zinc-950/60 p-1.5 shadow-lg ring-1 ring-black/20 backdrop-blur-md supports-[backdrop-filter]:bg-zinc-950/50";

const chip =
  "border-0 text-xs font-semibold shadow-sm ring-1 ring-black/10 backdrop-blur-sm";

/**
 * Badges overlaid on listing photos — frosted tray + light chips so copy stays readable on dark imagery.
 */
export function CarListingImageBadges({
  car,
  className,
  compact,
}: {
  car: Car;
  className?: string;
  /** Tighter padding for small thumbs */
  compact?: boolean;
}) {
  const hasAny =
    car.isNew || car.certified || car.trending || (car.discountPercent ?? 0) > 0;
  if (!hasAny) return null;

  return (
    <div className={cn(tray, compact && "gap-1 rounded-lg p-1", className)}>
      {car.isNew ? (
        <Badge className={cn(chip, "bg-zinc-100 text-zinc-900 ring-zinc-300/80")}>New</Badge>
      ) : null}
      {car.certified ? (
        <Badge
          className={cn(
            chip,
            "inline-flex items-center gap-0.5 bg-white text-zinc-900 ring-zinc-300/90"
          )}
        >
          <ShieldCheck className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
          Certified
        </Badge>
      ) : null}
      {car.trending ? (
        <Badge className={cn(chip, "bg-amber-50 text-amber-950 ring-amber-200/80")}>Trending</Badge>
      ) : null}
      {car.discountPercent > 0 ? (
        <Badge className={cn(chip, "bg-primary text-primary-foreground ring-primary/30")}>
          {car.discountPercent}% off
        </Badge>
      ) : null}
    </div>
  );
}
