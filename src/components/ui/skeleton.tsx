import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-gradient-to-br from-muted/50 via-muted/70 to-muted/40 skeleton-shimmer",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
