"use client";

import Image from "next/image";
import {
  Car,
  CarFront,
  Cog,
  Fuel,
  Gauge,
  Leaf,
  MapPin,
  Sparkles,
  Sun,
  Users,
  Zap,
} from "lucide-react";
import type { AdvisorOption } from "@/lib/client/advisor-api";
import { cn } from "@/lib/utils";

function iconFromLabel(label: string) {
  const t = label.toLowerCase();
  if (t.includes("suv") || t.includes("muv")) return CarFront;
  if (t.includes("hatch") || t.includes("sedan")) return Car;
  if (t.includes("electric") || t.includes("ev")) return Zap;
  if (t.includes("hybrid") || t.includes("cng") || t.includes("petrol") || t.includes("diesel")) return Fuel;
  if (t.includes("mileage") || t.includes("efficient")) return Gauge;
  if (t.includes("sunroof") || t.includes("roof")) return Sun;
  if (t.includes("family") || t.includes("seat")) return Users;
  if (t.includes("city") || t.includes("urban")) return MapPin;
  if (t.includes("luxury") || t.includes("premium")) return Sparkles;
  if (t.includes("adas") || t.includes("feature") || t.includes("auto")) return Cog;
  if (t.includes("green") || t.includes("eco")) return Leaf;
  return Car;
}

type Props = {
  option: AdvisorOption;
  className?: string;
};

export function OptionIcon({ option, className }: Props) {
  const iconUrl = option.icon?.trim();
  if (iconUrl?.startsWith("http")) {
    return (
      <span className={cn("relative block h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-muted", className)}>
        <Image src={iconUrl} alt="" fill className="object-contain p-1" sizes="32px" />
      </span>
    );
  }
  const Icon = iconFromLabel(option.label);
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-200/80 text-zinc-700 ring-1 ring-zinc-300/60 dark:bg-zinc-300/40 dark:text-zinc-800 dark:ring-zinc-400/40",
        className
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
    </span>
  );
}
