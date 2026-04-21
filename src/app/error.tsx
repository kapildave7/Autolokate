"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { PageFade } from "@/components/shared/page-fade";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageFade>
      <div className="mx-auto flex min-h-[55vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center sm:py-24">
        <div className="w-full rounded-2xl border border-border bg-white px-8 py-12 shadow-sm sm:px-10 sm:py-14">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-warn-soft text-warn-soft-foreground">
            <AlertTriangle className="h-8 w-8" aria-hidden />
          </span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Temporary issue</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Let’s try that again</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {error.message || "Something went wrong loading this screen. Your place is saved — retry or head home."}
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button type="button" onClick={() => reset()} className="w-full sm:w-auto">
              Try again
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/">Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </PageFade>
  );
}
