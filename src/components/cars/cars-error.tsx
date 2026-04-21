"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CarsError({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10 px-6 py-14 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <h2 className="mt-4 text-lg font-semibold text-foreground">Something went wrong</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Something went wrong loading listings. Try again.
      </p>
      <Button variant="outline" className="mt-6 border-destructive/40" onClick={() => reset()}>
        Retry
      </Button>
    </div>
  );
}
