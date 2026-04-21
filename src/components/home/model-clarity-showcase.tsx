import Link from "next/link";
import { CheckCircle2, PlayCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RemoteImageWithFallback } from "@/components/ui/remote-image";
import type { Car } from "@/data/types";
import { videos } from "@/data";
import { carDetailPath } from "@/lib/seo/paths";
import { formatINR } from "@/lib/utils";

export function ModelClarityShowcase({ car }: { car: Car }) {
  const vid =
    videos.find((v) => car.brand.toLowerCase().includes(v.brandTag.toLowerCase())) ??
    videos.find((v) => v.trending) ??
    videos[0];
  const keySpecs = [
    { k: "Price", v: formatINR(car.price) },
    { k: "Engine", v: car.engine },
    { k: "Power", v: car.power },
    { k: "Mileage", v: car.mileage },
    { k: "Fuel", v: car.fuel },
    { k: "Transmission", v: car.transmission },
  ];
  return (
    <section className="border-b border-border bg-white py-12 sm:py-14">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Clear model page</p>
          <h2 className="font-display mt-2 text-2xl tracking-tight text-foreground sm:text-3xl">
            Everything clear at one glance
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Inspired by top auto portals: key specs, top features, quick variants mindset, and instant video context.
          </p>
          <Card className="mt-5 overflow-hidden border-border">
            <div className="relative aspect-[16/9]">
              <RemoteImageWithFallback src={car.images[0]} alt="" fill className="object-cover" />
              <Badge className="absolute left-3 top-3">{car.brand} {car.model}</Badge>
            </div>
            <CardContent className="p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {keySpecs.map((s) => (
                  <div key={s.k} className="rounded-xl border border-border bg-secondary/20 px-3 py-2">
                    <p className="text-[10px] uppercase text-muted-foreground">{s.k}</p>
                    <p className="text-sm font-medium text-foreground">{s.v}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {car.features.slice(0, 6).map((f) => (
                  <span key={f} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    {f}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild><Link href={carDetailPath(car)}>Open full model page</Link></Button>
                <Button variant="outline" asChild><Link href="/compare">Compare variants</Link></Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card className="h-fit border-border bg-card">
          <CardContent className="space-y-3 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Video context</p>
            <h3 className="text-lg font-semibold text-foreground">{vid.title}</h3>
            <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-black">
              <iframe
                title={vid.title}
                src={`${vid.embedUrl}${vid.embedUrl.includes("?") ? "&" : "?"}autoplay=0&mute=1&controls=1&playsinline=1`}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
            <Button variant="outline" asChild>
              <Link href={`/media/video/${vid.slug}`}>
                <PlayCircle className="h-4 w-4" />
                Watch from Indian Drive Guide
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

