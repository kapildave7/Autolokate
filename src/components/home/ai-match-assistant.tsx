"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BrainCircuit, Flame, PlayCircle, Sparkles, Wand2 } from "lucide-react";
import type { Bike, Car, MediaVideo } from "@/data/types";
import { bikes, cars, videos } from "@/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RemoteImageWithFallback } from "@/components/ui/remote-image";
import { carDetailPath } from "@/lib/seo/paths";
import { formatINR } from "@/lib/utils";

type Mode = "car" | "bike";
type UseCase = "city" | "highway" | "family" | "performance" | "value";

function scoreCar(c: Car, useCase: UseCase, budget: number, fuel: "any" | Car["fuel"]): number {
  let s = 0;
  if (c.price <= budget) s += 30;
  else s -= Math.min(25, Math.round((c.price - budget) / 100000));
  if (fuel !== "any" && c.fuel === fuel) s += 18;
  if (useCase === "city") {
    if (c.bodyType === "Hatchback" || c.bodyType === "Sedan") s += 14;
    if (c.transmission === "Automatic" || c.transmission === "CVT" || c.transmission === "e-CVT") s += 12;
    if (c.kms < 30000) s += 4;
  }
  if (useCase === "highway") {
    if (c.bodyType === "SUV") s += 12;
    if (Number(c.power.match(/[\d.]+/)?.[0]) >= 140) s += 10;
  }
  if (useCase === "family") {
    if (c.bodyType === "SUV" || c.bodyType === "MPV") s += 14;
    if (c.certified) s += 8;
  }
  if (useCase === "performance") {
    if (Number(c.power.match(/[\d.]+/)?.[0]) >= 150) s += 18;
    if (c.transmission === "DCT" || c.transmission === "Automatic") s += 8;
  }
  if (useCase === "value") {
    if (c.discountPercent >= 10) s += 16;
    if (c.estimatedEmiMonthly <= 25000) s += 12;
  }
  return s + (c.trending ? 4 : 0);
}

function scoreBike(b: Bike, useCase: UseCase, budget: number, fuel: "any" | Bike["fuel"]): number {
  let s = 0;
  if (b.price <= budget) s += 30;
  else s -= Math.min(25, Math.round((b.price - budget) / 10000));
  if (fuel !== "any" && b.fuel === fuel) s += 18;
  if (useCase === "city") {
    if (b.bodyType === "Commuter" || b.bodyType === "Scooter") s += 16;
    if (b.mileageKmpl >= 45 || b.fuel === "Electric") s += 12;
  }
  if (useCase === "highway") {
    if (b.engineCc >= 200 || b.bodyType === "Adventure" || b.bodyType === "Cruiser") s += 16;
  }
  if (useCase === "family") {
    if (b.bodyType === "Commuter" || b.bodyType === "Scooter") s += 12;
  }
  if (useCase === "performance") {
    if (b.bodyType === "Sports" || b.bodyType === "Naked") s += 16;
    if (b.engineCc >= 155) s += 8;
  }
  if (useCase === "value") {
    if (b.price <= 120000) s += 16;
    if (b.mileageKmpl >= 50 || b.fuel === "Electric") s += 10;
  }
  return s;
}

function bestVideoForCar(car: Car): MediaVideo | undefined {
  const brand = car.brand.toLowerCase();
  return videos.find((v) => brand.includes(v.brandTag.toLowerCase()) || v.brandTag.toLowerCase().includes(brand)) ?? videos[0];
}

function bestVideoForBike(bike: Bike): MediaVideo | undefined {
  if (bike.videoSlug) return videos.find((v) => v.slug === bike.videoSlug);
  return videos[0];
}

export function AiMatchAssistant() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("car");
  const [useCase, setUseCase] = useState<UseCase>("city");
  const [budgetCar, setBudgetCar] = useState(1500000);
  const [budgetBike, setBudgetBike] = useState(150000);
  const [fuelCar, setFuelCar] = useState<"any" | Car["fuel"]>("any");
  const [fuelBike, setFuelBike] = useState<"any" | Bike["fuel"]>("any");
  const [prompt, setPrompt] = useState("");

  const picks = useMemo(() => {
    if (mode === "car") {
      return [...cars]
        .map((c) => ({ c, score: scoreCar(c, useCase, budgetCar, fuelCar) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
    }
    return [...bikes]
      .map((b) => ({ b, score: scoreBike(b, useCase, budgetBike, fuelBike) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [mode, useCase, budgetCar, budgetBike, fuelCar, fuelBike]);

  function runPrompt() {
    const p = prompt.toLowerCase();
    if (!p.trim()) return;
    if (p.includes("bike") || p.includes("scooter")) setMode("bike");
    if (p.includes("car") || p.includes("suv") || p.includes("hatch")) setMode("car");
    if (p.includes("city") || p.includes("traffic")) setUseCase("city");
    if (p.includes("highway")) setUseCase("highway");
    if (p.includes("family")) setUseCase("family");
    if (p.includes("performance") || p.includes("power")) setUseCase("performance");
    if (p.includes("value") || p.includes("budget") || p.includes("cheap")) setUseCase("value");
    if (p.includes("electric") || p.includes("ev")) {
      if (mode === "bike") setFuelBike("Electric");
      else setFuelCar("Electric");
    }
    if (p.includes("diesel")) setFuelCar("Diesel");
    if (p.includes("petrol")) {
      if (mode === "bike") setFuelBike("Petrol");
      else setFuelCar("Petrol");
    }
    const m = p.match(/(\d+(?:\.\d+)?)\s*(lakh|lac|k|thousand)?/);
    if (m) {
      const n = Number(m[1]);
      const unit = m[2] ?? "";
      const value =
        unit.includes("lakh") || unit.includes("lac")
          ? Math.round(n * 100000)
          : unit === "k" || unit.includes("thousand")
            ? Math.round(n * 1000)
            : Math.round(n);
      if (mode === "bike") setBudgetBike(Math.max(60000, Math.min(300000, value)));
      else setBudgetCar(Math.max(500000, Math.min(5000000, value)));
    }

    const budget = mode === "bike" ? budgetBike : budgetCar;
    const fuel = mode === "bike" ? fuelBike : fuelCar;
    const params = new URLSearchParams({
      source: "ai",
      mode,
      useCase,
      budget: String(budget),
      fuel,
      prompt: prompt.trim() || `Need ${mode} recommendation for ${useCase}`,
    });
    router.push(`/chat?${params.toString()}`);
  }

  return (
    <section className="border-b border-border bg-[#f7f8fb] py-12 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Feature preview</p>
            <h2 className="font-display mt-2 text-2xl tracking-tight text-foreground sm:text-3xl">
              AI Match Assistant (Cars + Bikes)
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Select your use case and budget. We rank best-fit options with explainable logic and attach quick video guidance from Indian Drive Guide.
            </p>
          </div>
          <Badge variant="secondary" className="w-fit gap-1.5">
            <BrainCircuit className="h-3.5 w-3.5" />
            Prototype
          </Badge>
        </div>

        <Card className="border-border bg-white shadow-sm">
          <CardContent className="space-y-6 p-5 sm:p-6">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={mode === "car" ? "default" : "outline"} onClick={() => setMode("car")}>
                Cars
              </Button>
              <Button size="sm" variant={mode === "bike" ? "default" : "outline"} onClick={() => setMode("bike")}>
                Bikes
              </Button>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/30 p-3 sm:p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">AI prompt</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder='Try: "city automatic under 12 lakh", "electric scooter under 1.5 lakh"'
                  className="h-10 rounded-xl border-border bg-white focus-visible:ring-primary/25"
                />
                <Button type="button" onClick={runPrompt}>
                  <BrainCircuit className="h-4 w-4" />
                  Generate picks
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(["city", "highway", "family", "performance", "value"] as UseCase[]).map((u) => (
                <Button key={u} size="sm" variant={useCase === u ? "secondary" : "outline"} onClick={() => setUseCase(u)}>
                  <Wand2 className="h-3.5 w-3.5" />
                  {u}
                </Button>
              ))}
            </div>

            {mode === "car" ? (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-muted-foreground">Budget:</span>
                {[800000, 1500000, 2500000, 4000000].map((b) => (
                  <Button key={b} size="sm" variant={budgetCar === b ? "secondary" : "outline"} onClick={() => setBudgetCar(b)}>
                    {formatINR(b)}
                  </Button>
                ))}
                <span className="ml-1 text-muted-foreground">Fuel:</span>
                {(["any", "Petrol", "Diesel", "CNG", "Electric", "Hybrid"] as const).map((f) => (
                  <Button key={f} size="sm" variant={fuelCar === f ? "secondary" : "outline"} onClick={() => setFuelCar(f)}>
                    {f}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-muted-foreground">Budget:</span>
                {[90000, 150000, 220000].map((b) => (
                  <Button key={b} size="sm" variant={budgetBike === b ? "secondary" : "outline"} onClick={() => setBudgetBike(b)}>
                    {formatINR(b)}
                  </Button>
                ))}
                <span className="ml-1 text-muted-foreground">Fuel:</span>
                {(["any", "Petrol", "Electric"] as const).map((f) => (
                  <Button key={f} size="sm" variant={fuelBike === f ? "secondary" : "outline"} onClick={() => setFuelBike(f)}>
                    {f}
                  </Button>
                ))}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              {picks.map((p, idx) => {
                if ("c" in p) {
                  const v = bestVideoForCar(p.c);
                  return (
                    <Card key={p.c.id} className="overflow-hidden border-border/80">
                      <div className="relative aspect-[16/10]">
                        <RemoteImageWithFallback src={p.c.images[0]} alt="" fill className="object-cover" sizes="33vw" />
                        <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-1 text-[10px] font-semibold text-white">
                          Match #{idx + 1}
                        </span>
                      </div>
                      <CardContent className="space-y-2 p-4">
                        <p className="font-semibold text-foreground">{p.c.brand} {p.c.model}</p>
                        <p className="text-xs text-muted-foreground">{p.c.variant} • {p.c.city}</p>
                        <p className="text-sm font-bold text-primary">{formatINR(p.c.price)}</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button size="sm" asChild>
                            <Link href={carDetailPath(p.c)}>Open details</Link>
                          </Button>
                          {v ? (
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/media/video/${v.slug}`}>
                                <PlayCircle className="h-3.5 w-3.5" />
                                Video
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                const v = bestVideoForBike(p.b);
                return (
                  <Card key={p.b.id} className="overflow-hidden border-border/80">
                    <div className="relative aspect-[16/10]">
                      <RemoteImageWithFallback src={p.b.image} alt="" fill className="object-cover" sizes="33vw" />
                      <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-1 text-[10px] font-semibold text-white">
                        Bike Match #{idx + 1}
                      </span>
                    </div>
                    <CardContent className="space-y-2 p-4">
                      <p className="font-semibold text-foreground">{p.b.brand} {p.b.model}</p>
                      <p className="text-xs text-muted-foreground">{p.b.variant} • {p.b.bodyType}</p>
                      <p className="text-sm font-bold text-primary">{formatINR(p.b.price)}</p>
                      <p className="text-xs text-muted-foreground">{p.b.engineCc ? `${p.b.engineCc}cc` : "EV"} • {p.b.fuel}</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/media">
                            <Sparkles className="h-3.5 w-3.5" />
                            Bike hub soon
                          </Link>
                        </Button>
                        {v ? (
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/media/video/${v.slug}`}>
                              <PlayCircle className="h-3.5 w-3.5" />
                              Video
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground">
              <Flame className="mr-1 inline h-3.5 w-3.5 text-primary" />
              Next step: replace heuristic scoring with real model inference and conversational intent memory.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

