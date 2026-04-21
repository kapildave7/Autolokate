"use client";

import type { TcoBreakdown } from "@/lib/client/prices-api";
import { cn, formatINR } from "@/lib/utils";

type Segment = { label: string; value: number; barClass: string; dotClass: string };

const SEGMENTS: Omit<Segment, "value">[] = [
  { label: "Purchase", barClass: "bg-[#1E3A8A]", dotClass: "bg-[#1E3A8A]" },
  { label: "Fuel", barClass: "bg-[#F97316]", dotClass: "bg-[#F97316]" },
  { label: "Insurance", barClass: "bg-[#2563EB]/85", dotClass: "bg-[#2563EB]" },
  { label: "Maintenance", barClass: "bg-[#0D9488]", dotClass: "bg-[#0D9488]" },
  { label: "Depreciation", barClass: "bg-[#64748B]", dotClass: "bg-[#64748B]" },
];

type Props = {
  tco: TcoBreakdown;
  className?: string;
};

/**
 * Visual 5-year TCO split — horizontal stacked bar + row labels (light theme).
 */
export function TcoCostBreakdownBars({ tco, className }: Props) {
  const values = [
    tco.purchase_price,
    tco.fuel_cost,
    tco.insurance_cost,
    tco.maintenance_cost,
    tco.depreciation,
  ];
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const widths = values.map((v) => Math.max(0, (v / total) * 100));

  return (
    <div className={cn("space-y-4", className)}>
      <div className="overflow-hidden rounded-xl bg-[#E5E7EB]/80 p-1">
        <div className="flex h-3 w-full overflow-hidden rounded-lg">
          {widths.map((pct, i) => (
            <div
              key={SEGMENTS[i]!.label}
              title={`${SEGMENTS[i]!.label}: ${formatINR(values[i]!)}`}
              className={cn("h-full min-w-px transition-all duration-300", SEGMENTS[i]!.barClass)}
              style={{ width: `${pct}%` }}
            />
          ))}
        </div>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {SEGMENTS.map((seg, i) => (
          <li
            key={seg.label}
            className="flex items-center justify-between gap-3 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2 text-[#6B7280]">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", seg.dotClass)} aria-hidden />
              <span className="truncate font-medium">{seg.label}</span>
            </span>
            <span className="shrink-0 tabular-nums font-semibold text-[#111827]">{formatINR(values[i]!)}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-[#FACC15]/50 bg-[#FFFBEB] px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#92400E]">Total cost (period)</p>
          <p className="mt-0.5 font-display text-lg font-bold tabular-nums text-[#111827]">{formatINR(tco.total_cost)}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-medium text-[#6B7280]">Cost per km</p>
          <p className="font-display text-base font-bold tabular-nums text-[#1E3A8A]">{formatINR(tco.cost_per_km)} / km</p>
        </div>
      </div>
    </div>
  );
}
