"use client";

import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  onBack?: () => void;
  onNext: () => void;
  backDisabled?: boolean;
  nextDisabled?: boolean;
  nextLabel?: string;
  loading?: boolean;
  showBack?: boolean;
};

export function StepFooter({
  onBack,
  onNext,
  backDisabled,
  nextDisabled,
  nextLabel = "Next",
  loading,
  showBack = true,
}: Props) {
  return (
    <div
      className={cn(
        "mt-auto flex flex-col gap-3 border-t border-zinc-200/80 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950 sm:px-5 sm:py-4"
      )}
    >
      <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {showBack && onBack ? (
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl border-zinc-300 bg-white text-foreground hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:w-auto"
            disabled={backDisabled || loading}
            onClick={onBack}
          >
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
            Back
          </Button>
        ) : (
          <span className="hidden sm:block sm:w-24" />
        )}
        <Button
          type="button"
          className="w-full rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:shadow-blue-500/30 dark:hover:bg-blue-600 sm:min-w-[140px] sm:w-auto"
          disabled={nextDisabled || loading}
          onClick={onNext}
        >
          {loading ? "Saving…" : nextLabel}
          {!loading ? <ChevronRight className="ml-1 h-4 w-4" aria-hidden /> : null}
        </Button>
      </div>
      <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground dark:text-zinc-500">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70 dark:text-zinc-600" aria-hidden />
        100% Secure · No spam · Personalised for you
      </p>
    </div>
  );
}
