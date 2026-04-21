"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, UploadCloud } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatINR } from "@/lib/utils";
import { PageFade } from "@/components/shared/page-fade";

const steps = ["Details", "Photos", "Pricing", "Preview", "Submit"] as const;

export function SellFlow() {
  const [step, setStep] = useState(0);
  const progress = ((step + 1) / steps.length) * 100;
  const [brand, setBrand] = useState("Hyundai");
  const [model, setModel] = useState("Creta");
  const [year, setYear] = useState("2021");
  const [kms, setKms] = useState("32000");

  const estimateRangeLow = 1120000;
  const estimateRangeHigh = 1280000;

  function next() {
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <PageFade>
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">List with confidence</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Sell your car</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        Guided steps and an estimated price band — review before you publish your listing.
      </p>

      <div className="mt-8 space-y-3">
        <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>
            Step {step + 1} / {steps.length}
          </span>
          <span>{steps[step]}</span>
        </div>
        <Progress value={progress} />
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {steps.map((s, i) => (
          <span
            key={s}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              i === step
                ? "bg-primary/15 text-primary"
                : i < step
                  ? "bg-secondary text-muted-foreground"
                  : "bg-secondary/50 text-zinc-600"
            }`}
          >
            {i < step ? "✓ " : ""}
            {s}
          </span>
        ))}
      </div>

      <Card className="glass-card mt-10 border-border/80">
        <CardContent className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">Vehicle details</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Model</Label>
                      <Input value={model} onChange={(e) => setModel(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Input value={year} onChange={(e) => setYear(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Kilometers</Label>
                      <Input value={kms} onChange={(e) => setKms(e.target.value)} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Variant</Label>
                      <Select defaultValue="sx">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sx">SX(O)</SelectItem>
                          <SelectItem value="e">E</SelectItem>
                          <SelectItem value="s">S</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">Upload images</h2>
                  <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-secondary/30">
                    <UploadCloud className="h-10 w-10 text-primary" />
                    <p className="mt-3 text-sm text-muted-foreground">
                      Drag & drop here — uploads connect to your storage in production.
                    </p>
                    <Button variant="secondary" className="mt-4" type="button">
                      Choose files
                    </Button>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">Price suggestion</h2>
                  <p className="text-sm text-muted-foreground">
                    Based on OBV-style market signals for {brand} {model} ({year}).
                  </p>
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                    <p className="text-xs uppercase text-muted-foreground">Recommended range</p>
                    <p className="mt-2 text-3xl font-bold text-foreground">
                      {formatINR(estimateRangeLow)} – {formatINR(estimateRangeHigh)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Your asking price</Label>
                    <Input type="number" defaultValue={1200000} />
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">Preview</h2>
                  <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm">
                    <p className="font-semibold text-foreground">
                      {brand} {model} · {year}
                    </p>
                    <p className="text-muted-foreground">{kms} km · photos staged for preview</p>
                    <Separator className="my-3" />
                    <p className="text-primary">{formatINR(1200000)}</p>
                  </div>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-green-mid/25 text-brand-green-mid">
                    <Check className="h-7 w-7" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Listing submitted</h2>
                  <p className="text-sm text-muted-foreground">
                    Dealer ops would receive this payload and trigger inspection scheduling.
                  </p>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex justify-between gap-3">
            <Button type="button" variant="outline" onClick={back} disabled={step === 0}>
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button type="button" onClick={next}>
                Continue
              </Button>
            ) : (
              <Button type="button" variant="secondary" onClick={() => setStep(0)}>
                Start over
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
    </PageFade>
  );
}
