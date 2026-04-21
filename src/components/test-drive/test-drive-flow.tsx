"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, CarFront, CheckCircle2 } from "lucide-react";
import { RemoteImageWithFallback } from "@/components/ui/remote-image";
import { getCarById } from "@/data";
import { carDetailPath } from "@/lib/seo/paths";
import { TEST_DRIVE_SLOTS } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageFade } from "@/components/shared/page-fade";
import { CarQuickPicker } from "@/components/cars/car-quick-picker";

export function TestDriveFlow() {
  const router = useRouter();
  const sp = useSearchParams();
  const carId = sp.get("carId") || "";
  const car = useMemo(() => getCarById(carId), [carId]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slot, setSlot] = useState(TEST_DRIVE_SLOTS[0]);
  const [done, setDone] = useState(false);

  if (!car) {
    return (
      <PageFade>
        <section className="border-b border-border bg-gradient-to-b from-secondary/60 to-background">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <Badge variant="secondary" className="mb-3 border-primary/15 bg-primary/8 text-primary">
              Test drive
            </Badge>
            <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">Choose a car to book</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Pick any listing below — you&apos;ll stay on Autolokate and move straight into date &amp; slot selection.
            </p>
          </div>
        </section>
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
          <CarQuickPicker
            title="Pick from inventory"
            description="Search the catalog and tap Schedule — no car page required."
            actionLabel="Schedule"
            secondaryActionLabel="Listing"
            onAction={(c) => router.push(`/test-drive?carId=${encodeURIComponent(c.id)}`)}
          />
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Prefer browsing?{" "}
            <Link href="/cars" className="font-semibold text-primary underline-offset-4 hover:underline">
              Open the full inventory grid
            </Link>
          </p>
        </div>
      </PageFade>
    );
  }

  return (
    <PageFade>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-6 text-muted-foreground" asChild>
          <Link href={carDetailPath(car)}>← Back to listing</Link>
        </Button>

        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <Badge variant="secondary" className="mb-2">
                    Test drive
                  </Badge>
                  <h1 className="text-3xl font-bold text-foreground">Schedule a slot</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Pick a date and time — confirmation is instant in this flow.
                  </p>
                </div>
              </div>

              <Card className="mt-8 border-border bg-card/70 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg">
                    <RemoteImageWithFallback src={car.images[0]} alt="" fill className="object-cover" sizes="96px" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground">
                      {car.brand} {car.model}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{car.variant}</p>
                    <p className="mt-1 text-sm text-primary">{formatINR(car.price)}</p>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="td-date" className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      Date
                    </Label>
                    <Input
                      id="td-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-foreground">Available slots</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {TEST_DRIVE_SLOTS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSlot(s)}
                          className={`rounded-full border px-4 py-2 text-sm transition ${
                            slot === s
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/25"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" defaultValue="You" className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" defaultValue="+91 98765 43210" className="mt-2" />
                  </div>
                  <div className="sm:col-span-2">
                    <Button className="w-full gap-2" size="lg" type="button" onClick={() => setDone(true)}>
                      <CarFront className="h-4 w-4" />
                      Confirm test drive
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-border bg-gradient-to-br from-primary/[0.06] via-card to-card p-10 text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-green-mid/20 text-brand-green-mid">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-foreground">Drive confirmed</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {car.brand} {car.model} · {date} · {slot}
              </p>
              <p className="mt-4 text-xs text-zinc-500">
                You&apos;ll receive a calendar invite and dealer directions via SMS.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button variant="outline" className="border-primary/25" asChild>
                  <Link href={carDetailPath(car)}>View listing</Link>
                </Button>
                <Button asChild>
                  <Link href="/">Browse more</Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageFade>
  );
}
