import { CarsGridSkeleton } from "@/components/cars/cars-grid-skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-9 w-56 animate-pulse rounded-lg bg-muted/50" />
      <div className="mt-3 h-4 w-full max-w-md animate-pulse rounded bg-muted/40" />
      <div className="mt-10">
        <CarsGridSkeleton />
      </div>
    </div>
  );
}
