"use client";

import { format, startOfDay } from "date-fns";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import "react-day-picker/style.css";

function DayPickerChevron(props: {
  className?: string;
  size?: number;
  disabled?: boolean;
  orientation?: "up" | "down" | "left" | "right";
}) {
  const { orientation = "left", className, size = 20 } = props;
  const c = cn("shrink-0 text-zinc-400", className);
  if (orientation === "left") return <ChevronLeft className={c} size={size} strokeWidth={2} aria-hidden />;
  if (orientation === "right") return <ChevronRight className={c} size={size} strokeWidth={2} aria-hidden />;
  if (orientation === "down") return <ChevronDown className={c} size={size} strokeWidth={2} aria-hidden />;
  return <ChevronUp className={c} size={size} strokeWidth={2} aria-hidden />;
}

type Props = {
  id?: string;
  value: string;
  onChange: (isoDate: string) => void;
  className?: string;
  /** Shorter trigger and date label for dense layouts */
  compact?: boolean;
};

export function BookExpertCalendar({ id, value, onChange, className, compact }: Props) {
  const [open, setOpen] = useState(false);
  const parsed = value ? new Date(`${value}T12:00:00`) : undefined;
  const selected = parsed && !Number.isNaN(parsed.getTime()) ? parsed : undefined;
  const today = startOfDay(new Date());

  const label = selected
    ? format(selected, compact ? "EEE, d MMM yyyy" : "EEEE, d MMMM yyyy")
    : "Choose a date";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between border-zinc-600/80 bg-zinc-950/95 font-normal text-zinc-100 shadow-none hover:bg-zinc-900 hover:text-zinc-100",
            compact ? "h-10 rounded-lg px-3 text-sm" : "h-11 rounded-xl px-3",
            !value && "text-zinc-500",
            className
          )}
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            <CalendarDays
              className={cn("shrink-0 text-emerald-500/80", compact ? "h-3.5 w-3.5" : "h-4 w-4")}
              aria-hidden
            />
            <span className="truncate">{label}</span>
          </span>
          <ChevronDown className={cn("shrink-0 text-zinc-500", compact ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto border-white/10 bg-zinc-900 p-0 text-zinc-100 shadow-2xl"
        sideOffset={6}
      >
        <div
          className="book-expert-rdp rounded-xl p-3 sm:p-4"
          style={
            {
              "--rdp-accent-color": "rgb(52 211 153)",
              "--rdp-accent-background-color": "rgba(16, 185, 129, 0.15)",
              "--rdp-day-height": "40px",
              "--rdp-day-width": "40px",
              "--rdp-day_button-height": "38px",
              "--rdp-day_button-width": "38px",
              "--rdp-day_button-border-radius": "12px",
              "--rdp-selected-border": "2px solid rgb(52 211 153)",
              color: "rgb(228 228 231)",
            } as CSSProperties
          }
        >
          <DayPicker
            mode="single"
            required={false}
            selected={selected}
            onSelect={(d) => {
              if (d) {
                onChange(format(d, "yyyy-MM-dd"));
                setOpen(false);
              }
            }}
            disabled={{ before: today }}
            showOutsideDays
            components={{ Chevron: DayPickerChevron }}
            className="mx-auto [--rdp-nav-height:2.5rem]"
            classNames={{
              root: "rdp-root w-full max-w-[320px] mx-auto text-sm",
              months: "relative flex flex-col gap-4",
              month: "space-y-3",
              month_caption: "flex h-10 items-center justify-center px-10",
              caption_label: "text-sm font-semibold tracking-tight text-white",
              nav: "absolute inset-x-0 top-0 flex w-full justify-between px-1",
              button_previous:
                "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-zinc-950/90 text-zinc-300 hover:bg-zinc-800 hover:text-white [&_svg]:text-zinc-300",
              button_next:
                "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-zinc-950/90 text-zinc-300 hover:bg-zinc-800 hover:text-white [&_svg]:text-zinc-300",
              month_grid: "w-full border-collapse",
              weekdays: "mb-1",
              weekday: "w-10 text-center text-[11px] font-bold uppercase tracking-wider text-zinc-500",
              week: "",
              day: "p-0 text-center",
              day_button:
                "inline-flex size-10 items-center justify-center rounded-xl text-sm font-medium text-zinc-200 transition-colors hover:bg-white/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-500/60",
              selected:
                "!bg-emerald-500/25 !text-emerald-100 ring-1 ring-emerald-400/40 hover:!bg-emerald-500/35",
              today: "font-bold text-emerald-300",
              disabled: "text-zinc-600 opacity-40 hover:bg-transparent",
              outside: "text-zinc-600 opacity-50",
              chevron: "!text-zinc-400",
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
