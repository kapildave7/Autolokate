import Link from "next/link";
import { CarFront, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CarsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center shadow-sm sm:py-20">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
        <SearchX className="h-7 w-7" aria-hidden />
      </span>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">No listings match</p>
      <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">Try a wider search</h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        Relax price or location, try another fuel or body type, or open the full inventory — small changes often surface
        strong alternatives.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        <Button asChild>
          <Link href="/cars">
            <CarFront className="h-4 w-4" />
            Browse all cars
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/cars/explore">Mixed discovery view</Link>
        </Button>
      </div>
    </div>
  );
}
