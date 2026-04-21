"use client";

import Link from "next/link";
import { useState } from "react";
import { PlayCircle, ZoomIn } from "lucide-react";
import type { Bike, MediaVideo } from "@/data/types";
import { bikePath } from "@/lib/seo/bike-paths";
import { RemoteImageWithFallback } from "@/components/ui/remote-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatINR } from "@/lib/utils";

export function BikeDetailView({
  bike,
  relatedVideo,
  sameModel,
  similar,
}: {
  bike: Bike;
  relatedVideo: MediaVideo;
  sameModel: Bike[];
  similar: Bike[];
}) {
  const images = bike.gallery?.length ? bike.gallery : [bike.image];
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/bikes" className="text-sm text-primary hover:underline">← Back to bikes</Link>
      <div className="mt-5 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden border-border">
          <div
            className="relative aspect-16/10 cursor-zoom-in"
            onClick={() => setZoom(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setZoom(true)}
          >
            <RemoteImageWithFallback src={images[idx]} alt="" fill className="object-cover" />
            <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-md bg-black/65 px-2 py-1 text-[10px] text-white">
              <ZoomIn className="h-3 w-3" />
              Tap to zoom
            </span>
          </div>
          <CardContent className="space-y-2 p-5">
            <h1 className="font-display text-3xl tracking-tight text-foreground">{bike.brand} {bike.model}</h1>
            <p className="text-sm text-muted-foreground">{bike.variant}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{bike.bodyType}</Badge>
              <Badge variant="outline">{bike.fuel}</Badge>
              <Badge variant="outline">{bike.engineCc ? `${bike.engineCc}cc` : "Electric"}</Badge>
            </div>
            {bike.colors?.length ? (
              <div className="pt-2">
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Available colors</p>
                <div className="flex flex-wrap gap-2">
                  {bike.colors.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
                </div>
              </div>
            ) : null}
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={`${bike.id}-thumb-${i}`}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 ${i === idx ? "border-primary" : "border-transparent opacity-80"}`}
                >
                  <RemoteImageWithFallback src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
            <p className="text-xl font-bold text-primary">{formatINR(bike.price)}</p>
          </CardContent>
        </Card>
        <div className="space-y-5">
          <Card className="border-border">
            <CardContent className="space-y-3 p-5">
              <h2 className="text-lg font-semibold text-foreground">Key specs and features</h2>
              <p className="text-sm text-muted-foreground">Mileage: {bike.mileageKmpl ? `${bike.mileageKmpl} kmpl` : "EV range variant"}</p>
              <p className="text-sm text-muted-foreground">City focus: {bike.city}</p>
              {bike.keyFeatures?.map((x) => <p key={x} className="text-sm text-muted-foreground">• {x}</p>)}
            </CardContent>
          </Card>
          <Card className="border-border"><CardContent className="space-y-3 p-5"><h2 className="text-lg font-semibold text-foreground">Pros</h2>{bike.pros.map((p) => <p key={p} className="text-sm text-muted-foreground">• {p}</p>)}</CardContent></Card>
          <Card className="border-border"><CardContent className="space-y-3 p-5"><h2 className="text-lg font-semibold text-foreground">Cons</h2>{bike.cons.map((p) => <p key={p} className="text-sm text-muted-foreground">• {p}</p>)}</CardContent></Card>
          <Button asChild><Link href={`/media/video/${relatedVideo.slug}`}><PlayCircle className="h-4 w-4" />Watch related clip</Link></Button>
          {sameModel.length > 1 ? (
            <Card className="border-border">
              <CardContent className="space-y-3 p-5">
                <h2 className="text-lg font-semibold text-foreground">Other variants</h2>
                {sameModel.map((m) => <p key={m.id} className="text-sm text-muted-foreground">• {m.variant} — {formatINR(m.price)}</p>)}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
      {similar.length ? (
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-foreground">Similar bikes you can shortlist</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((x) => (
              <Card key={x.id} className="border-border">
                <CardContent className="p-4">
                  <p className="font-medium text-foreground">{x.brand} {x.model}</p>
                  <p className="text-xs text-muted-foreground">{x.variant}</p>
                  <p className="mt-1 text-sm font-semibold text-primary">{formatINR(x.price)}</p>
                  <Button size="sm" variant="outline" className="mt-3" asChild><Link href={bikePath(x)}>View</Link></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-h-[95vh] max-w-[95vw] border-border bg-white p-2 sm:p-4">
          <div className="relative aspect-video w-full max-w-5xl">
            <RemoteImageWithFallback src={images[idx]} alt="" fill className="object-contain" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
