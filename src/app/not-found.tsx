import Link from "next/link";
import { Compass } from "lucide-react";
import { PageFade } from "@/components/shared/page-fade";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageFade>
      <div className="mx-auto flex min-h-[55vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center sm:py-24">
        <div className="w-full rounded-2xl border border-border bg-white px-8 py-12 shadow-sm sm:px-10 sm:py-14">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Compass className="h-8 w-8" aria-hidden />
          </span>
          <h1 className="mt-8 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">This page isn’t here</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            The link may be outdated, or the page moved. Head home or open Compare — research picks up where you left off.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/">Back to home</Link>
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/compare">Compare models</Link>
            </Button>
          </div>
        </div>
      </div>
    </PageFade>
  );
}
