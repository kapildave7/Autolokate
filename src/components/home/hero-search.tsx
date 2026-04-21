"use client";

import { motion } from "framer-motion";
import { MapPin, Search, Sparkles, IndianRupee } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { brands, cars } from "@/data";
import { carDetailPath } from "@/lib/seo/paths";
import { cn } from "@/lib/utils";
import { GA_CATEGORIES, carEntityParams, trackEvent } from "@/lib/analytics";

export function HeroSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [brand, setBrand] = useState<string>("all");
  const [city, setCity] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [mode, setMode] = useState<"model" | "budget">("model");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const max = maxPrice ? Number(maxPrice) : undefined;
    const effectiveBrand = mode === "budget" ? "all" : brand;
    const match = cars.find((c) => {
      const brandOk = effectiveBrand === "all" || c.brand === effectiveBrand;
      const cityOk = !city.trim() || c.city.toLowerCase().includes(city.trim().toLowerCase());
      const priceOk = max == null || !Number.isFinite(max) || c.price <= max;
      return brandOk && cityOk && priceOk;
    });
    if (match) {
      trackEvent("hero_search_submit", {
        event_category: GA_CATEGORIES.home,
        mode,
        had_match: true,
        ...carEntityParams(match),
      });
      router.push(carDetailPath(match));
    } else {
      trackEvent("hero_search_submit", {
        event_category: GA_CATEGORIES.home,
        mode,
        had_match: false,
      });
      router.push("/compare");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={cn("relative mx-auto mt-10 w-full min-w-0 max-w-4xl", className)}
    >
      <div
        className="pointer-events-none absolute -inset-1 rounded-2xl bg-linear-to-br from-primary/12 via-secondary/60 to-primary/6 opacity-80 blur-md sm:-inset-px sm:rounded-[1.2rem]"
        aria-hidden
      />
      <form
        onSubmit={onSubmit}
        className="relative w-full min-w-0 overflow-hidden rounded-2xl border border-border bg-white p-1 shadow-md ring-1 ring-stone-900/[0.04] sm:rounded-[1.35rem] sm:shadow-[0_20px_50px_-28px_rgba(15,23,42,0.1),0_6px_20px_-10px_rgba(249,115,22,0.1)]"
      >
        <div
          role="tablist"
          aria-label="Search mode"
          className="grid w-full min-w-0 grid-cols-2 gap-1 rounded-xl bg-muted/90 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "model"}
            onClick={() => {
              setMode("model");
              trackEvent("hero_search_mode_change", { event_category: GA_CATEGORIES.home, mode: "model" });
            }}
            className={cn(
              "flex min-h-10 min-w-0 items-center justify-center rounded-lg px-2 py-2 text-center text-xs font-semibold leading-tight transition sm:min-h-11 sm:px-3 sm:text-sm",
              mode === "model" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Brand &amp; model
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "budget"}
            onClick={() => {
              setMode("budget");
              trackEvent("hero_search_mode_change", { event_category: GA_CATEGORIES.home, mode: "budget" });
            }}
            className={cn(
              "flex min-h-10 min-w-0 items-center justify-center rounded-lg px-2 py-2 text-center text-xs font-semibold leading-tight transition sm:min-h-11 sm:px-3 sm:text-sm",
              mode === "budget" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            City &amp; budget
          </button>
        </div>

        {/* Stacked blocks — avoids cramped 12-col row inside narrow columns */}
        <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5 md:p-6">
          {mode === "model" ? (
            <div className="min-w-0 space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                Brand
              </label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger className="h-11 w-full min-w-0 rounded-xl border-border bg-white text-left shadow-sm sm:h-12 [&>span]:truncate">
                  <SelectValue placeholder="Popular brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All brands</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
            <div className="min-w-0 space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                City
              </label>
              <Input
                className="h-11 w-full min-w-0 rounded-xl shadow-sm sm:h-12"
                placeholder="e.g. Mumbai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="min-w-0 space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <IndianRupee className="h-3.5 w-3.5 shrink-0 text-primary" />
                Max budget
              </label>
              <Input
                className="h-11 w-full min-w-0 rounded-xl shadow-sm sm:h-12"
                type="number"
                placeholder="2500000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            size="sm"
            className="h-9 w-full shrink-0 rounded-lg px-4 text-sm font-semibold sm:w-auto sm:self-end"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            Search
          </Button>
        </div>

        <p className="border-t border-border/80 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground text-pretty sm:px-5 sm:text-xs md:px-6">
          <span className="font-medium text-primary">Tip</span> Opens the closest model page — tuned for research (no
          checkout).
        </p>
      </form>
    </motion.div>
  );
}
