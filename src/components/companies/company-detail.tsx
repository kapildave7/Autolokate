"use client";

import { RemoteImageWithFallback } from "@/components/ui/remote-image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  CarFront,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import type { Company } from "@/data/types";
import type { Car } from "@/data/types";
import { bodyTypes, getCarById, getReviewsForCompany } from "@/data";
import { carDetailPath } from "@/lib/seo/paths";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CarCard } from "@/components/cars/car-card";
import { partnerMonogram } from "@/lib/utils";

const PAGE = 30;

function CarGridInfinite({
  cars,
  scrollRoot,
}: {
  cars: Car[];
  scrollRoot?: React.RefObject<HTMLDivElement | null>;
}) {
  const [n, setN] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setN(PAGE);
  }, [cars]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const root = scrollRoot?.current ?? null;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setN((x) => Math.min(x + PAGE, cars.length));
      },
      { root, rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [cars, scrollRoot]);

  const slice = cars.slice(0, n);

  return (
    <>
      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {slice.map((c, i) => (
          <div key={c.id} className="min-h-0">
            <CarCard car={c} index={i % 8} />
          </div>
        ))}
      </div>
      {n < cars.length ? (
        <div ref={sentinel} className="flex justify-center py-10">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">
          All {cars.length} listings loaded
        </p>
      )}
    </>
  );
}

export function CompanyDetail({ company, stock }: { company: Company; stock: Car[] }) {
  const [body, setBody] = useState<string>("all");
  const [fuel, setFuel] = useState<string>("all");
  const [certOnly, setCertOnly] = useState(false);
  const platformReviews = useMemo(() => getReviewsForCompany(company.id, 200), [company.id]);
  const mono = useMemo(() => partnerMonogram(company.name), [company.name]);

  const fuels = useMemo(() => [...new Set(stock.map((c) => c.fuel))].sort(), [stock]);
  const bodies = useMemo(() => {
    const fromStock = [...new Set(stock.map((c) => c.bodyType))].sort();
    return fromStock.length ? fromStock : bodyTypes;
  }, [stock]);

  const filtered = useMemo(() => {
    return stock.filter((c) => {
      if (body !== "all" && c.bodyType !== body) return false;
      if (fuel !== "all" && c.fuel !== fuel) return false;
      if (certOnly && !c.certified) return false;
      return true;
    });
  }, [stock, body, fuel, certOnly]);

  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={scrollRef}>
      <div className="relative h-56 w-full overflow-hidden sm:h-72 lg:h-96">
        <RemoteImageWithFallback
          src={company.bannerImage}
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white text-xl font-black tracking-tight text-primary shadow-lg ring-1 ring-black/10">
              {mono}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{company.name}</h1>
                {company.verified ? (
                  <Badge className="gap-1 border border-primary/30 bg-primary/10 text-primary">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{company.tagline}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-brand-yellow-mid backdrop-blur">
                  <Star className="h-3.5 w-3.5 fill-brand-yellow-mid" />
                  {company.rating}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-white backdrop-blur">
                  <CarFront className="h-3.5 w-3.5 text-brand-yellow-light" />
                  {company.listingsCount} cars live
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-white/80 backdrop-blur">
                  {company.reviewCount.toLocaleString("en-IN")} reviews
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Tabs defaultValue="cars" className="w-full">
          <TabsList className="mb-8 h-auto w-full flex-wrap justify-start gap-1 bg-secondary/40 p-2">
            <TabsTrigger value="cars" className="gap-2">
              <CarFront className="h-4 w-4" />
              Cars ({stock.length})
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <Star className="h-4 w-4" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-2">
              <Building2 className="h-4 w-4" />
              About
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cars" className="mt-0 space-y-8">
            <div className="grid gap-4 rounded-2xl border border-border bg-secondary/20 p-4 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Body type</Label>
                <Select value={body} onValueChange={setBody}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {bodies.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fuel</Label>
                <Select value={fuel} onValueChange={setFuel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {fuels.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/40 px-3 py-2 lg:col-span-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Certified only</p>
                  <p className="text-xs text-muted-foreground">Inspection-backed inventory</p>
                </div>
                <Switch checked={certOnly} onCheckedChange={setCertOnly} />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${body}-${fuel}-${certOnly}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                {filtered.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
                    No cars match these filters.
                  </p>
                ) : (
                  <CarGridInfinite cars={filtered} scrollRoot={scrollRef} />
                )}
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="reviews" className="mt-0">
            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">Platform reviews</h2>
                <p className="text-sm text-muted-foreground">
                  Scraped-style payloads tied to listings from this partner ({platformReviews.length} samples).
                </p>
                <div className="max-h-[720px] space-y-3 overflow-y-auto pr-2">
                  {platformReviews.map((r) => {
                    const car = getCarById(r.carId);
                    return (
                      <Card key={r.id} className="border-border bg-card/50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">{r.author}</p>
                            <span className="text-brand-yellow-mid">★ {r.rating}</span>
                          </div>
                          <p className="mt-1 text-sm font-medium text-muted-foreground">{r.title}</p>
                          <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                            <span>{r.date}</span>
                            {car ? (
                              <Link href={carDetailPath(car)} className="text-primary hover:underline">
                                View listing →
                              </Link>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
              <Card className="h-fit border-border bg-card/60 lg:sticky lg:top-24">
                <CardContent className="space-y-4 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Dealer spotlight
                  </h3>
                  {company.dealerReviews.map((r) => (
                    <div key={r.id} className="rounded-xl border border-border bg-secondary/40 p-3">
                      <p className="text-sm font-semibold text-foreground">{r.author}</p>
                      <p className="text-xs text-brand-yellow-mid">★ {r.rating}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
                      <p className="mt-2 text-[10px] uppercase text-zinc-500">{r.date}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="about" className="mt-0 space-y-6">
            <Card className="border-border bg-card/60">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-foreground">About {company.name}</h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{company.description}</p>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-secondary/40 p-4">
                    <p className="text-xs uppercase text-muted-foreground">Established</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{company.established}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary/40 p-4">
                    <p className="text-xs uppercase text-muted-foreground">Home city</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{company.city}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary/40 p-4">
                    <p className="text-xs uppercase text-muted-foreground">Live listings</p>
                    <p className="mt-1 text-xl font-bold text-primary">{company.listingsCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card/60 lg:sticky lg:top-24">
              <CardContent className="space-y-4 p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Contact
                </h3>
                <div className="flex gap-3 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{company.address}</span>
                </div>
                <div className="flex gap-3 text-sm text-muted-foreground">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{company.phone}</span>
                </div>
                <div className="flex gap-3 text-sm text-muted-foreground">
                  <Globe className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{company.website}</span>
                </div>
                <Button className="w-full gap-2" type="button" asChild>
                  <Link href="/chat">
                    <MessageCircle className="h-4 w-4" />
                    Chat on platform
                  </Link>
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  type="button"
                  onClick={() => toast.success("Callback requested")}
                >
                  Request callback
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
