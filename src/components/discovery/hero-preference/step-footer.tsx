"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
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
        "mt-auto flex flex-col-reverse gap-3 border-t border-zinc-200/80 bg-zinc-50 px-5 py-4 dark:border-zinc-300/50 dark:bg-zinc-100 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5"
      )}
    >
      {showBack && onBack ? (
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-xl border-border/90 sm:w-auto"
          disabled={backDisabled || loading}
          onClick={onBack}
        >
          <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
          Back
        </Button>
      ) : (
        <span className="hidden sm:block sm:w-28" />
      )}
      <Button
        type="button"
        className="w-full rounded-xl bg-foreground text-background shadow-md hover:bg-foreground/92 sm:min-w-[140px] sm:w-auto"
        disabled={nextDisabled || loading}
        onClick={onNext}
      >
        {loading ? "Saving…" : nextLabel}
        {!loading ? <ChevronRight className="ml-1 h-4 w-4" aria-hidden /> : null}
      </Button>
    </div>
  );
}
