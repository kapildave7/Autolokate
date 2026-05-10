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
      <span className={cn("relative block h-9 w-9 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800", className)}>
        <Image src={iconUrl} alt="" fill className="object-contain p-1.5" sizes="36px" />
      </span>
    );
  }
  const Icon = iconFromLabel(option.label);
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200/80 bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200/60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700/60",
        className
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
    </span>
  );
}
