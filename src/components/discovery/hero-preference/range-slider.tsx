"use client";

import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type Props = {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  formatValue?: (n: number) => string;
  className?: string;
  disabled?: boolean;
};

/** Generic range control for numeric steps when the API exposes bounds (optional use). */
export function RangeSlider({ min, max, step = 1, value, onChange, formatValue, className, disabled }: Props) {
  const label = formatValue ? formatValue(value) : String(value);
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Selected</span>
        <span className="font-semibold tabular-nums text-foreground">{label}</span>
      </div>
      <Slider
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? min)}
        className="py-2"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatValue ? formatValue(min) : min}</span>
        <span>{formatValue ? formatValue(max) : max}</span>
      </div>
    </div>
  );
}
