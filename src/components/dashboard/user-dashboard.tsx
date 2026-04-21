"use client";

import { RemoteImageWithFallback } from "@/components/ui/remote-image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bell,
  Bookmark,
  Copy,
  Gift,
  MessageCircle,
  Settings2,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import { bodyTypes, cars, getBestDeals } from "@/data";
import { carDetailPath } from "@/lib/seo/paths";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useCompareStore } from "@/stores/compare-store";
import { useGamificationStore } from "@/stores/gamification-store";
import { useRecentlyViewedStore } from "@/stores/recently-viewed-store";
import { useSavedComparisonsStore } from "@/stores/saved-comparisons-store";
import { useSavedStore } from "@/stores/saved-store";
import { useUserPrefsStore } from "@/stores/user-prefs-store";

const inquiries = [
  { id: "1", car: "BMW 3 Series", status: "Dealer replied", when: "Yesterday" },
  { id: "2", car: "Tata Nexon EV", status: "Awaiting callback", when: "2 days ago" },
];

export function UserDashboard() {
  const ids = useSavedStore((s) => s.ids);
  const savedCars = ids
    .map((id) => cars.find((c) => c.id === id))
    .filter((c): c is (typeof cars)[number] => Boolean(c));

  const recentIds = useRecentlyViewedStore((s) => s.ids);
  const recentCars = recentIds
    .map((id) => cars.find((c) => c.id === id))
    .filter((c): c is (typeof cars)[number] => Boolean(c));

  const savedCmp = useSavedComparisonsStore((s) => s.saved);
  const removeCmp = useSavedComparisonsStore((s) => s.remove);
  const setCompareVariantIds = useCompareStore((s) => s.setVariantIds);

  const budgetMax = useUserPrefsStore((s) => s.budgetMax);
  const setBudget = useUserPrefsStore((s) => s.setBudget);
  const preferredFuels = useUserPrefsStore((s) => s.preferredFuels);
  const toggleFuel = useUserPrefsStore((s) => s.toggleFuel);
  const prefBodies = useUserPrefsStore((s) => s.bodyTypes);
  const toggleBody = useUserPrefsStore((s) => s.toggleBody);

  const points = useGamificationStore((s) => s.points);
  const referralCode = useGamificationStore((s) => s.referralCode);
  const addPoints = useGamificationStore((s) => s.addPoints);

  const dealAlerts = getBestDeals(5).filter((c) => c.discountPercent >= 5);

  function loadComparison(variantIds: string[]) {
    setCompareVariantIds(variantIds);
    toast.success("Loaded into compare tray");
  }

  function copyReferral() {
    void navigator.clipboard.writeText(referralCode);
    toast.success("Referral code copied");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your garage</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Saved cars, comparisons, alerts, and preference signals for the match engine — all local-first.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="border-primary/25" asChild>
            <Link href="/compare">Browse compare</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/compare">Open compare</Link>
          </Button>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <Card className="border-border bg-gradient-to-br from-primary/[0.06] via-card to-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Gift className="h-4 w-4 text-primary" />
              Rewards
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="border-primary/25"
              type="button"
              onClick={() => addPoints(25)}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Earn +25
            </Button>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Autolokate points</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{points}</p>
              <p className="mt-2 text-xs text-muted-foreground">Redeem on concierge fees when available.</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <p className="text-xs font-semibold text-foreground">Refer & earn</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="rounded-lg border border-border bg-secondary px-2 py-1 text-sm text-foreground">{referralCode}</code>
                <Button size="icon" variant="ghost" type="button" onClick={copyReferral} aria-label="Copy code">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Bell className="h-4 w-4 text-primary" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dealAlerts.slice(0, 4).map((c) => (
              <Link
                key={c.id}
                href={carDetailPath(c)}
                className="block rounded-xl border border-border bg-secondary/40 p-3 transition hover:border-primary/30"
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <TrendingDown className="h-4 w-4 text-brand-green-mid" />
                  Price action
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.brand} {c.model} · {c.discountPercent}% off list
                </p>
              </Link>
            ))}
            {dealAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No alerts right now.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="border-border bg-card/60 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground">Saved cars</CardTitle>
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {savedCars.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                No saved vehicles yet. Tap the heart on any listing.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {savedCars.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="overflow-hidden rounded-xl border border-border bg-secondary/40"
                  >
                    <Link href={carDetailPath(c)} className="flex gap-3 p-3">
                      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg">
                        <RemoteImageWithFallback src={c.images[0]} alt="" fill className="object-cover" sizes="112px" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {c.brand} {c.model}
                        </p>
                        <p className="text-xs text-muted-foreground">{c.variant}</p>
                        <p className="mt-1 text-sm text-primary">{formatINR(c.price)}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <MessageCircle className="h-4 w-4 text-primary" />
              Inquiries
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {inquiries.map((q) => (
              <div key={q.id} className="rounded-xl border border-border bg-secondary/40 p-3">
                <p className="text-sm font-semibold text-foreground">{q.car}</p>
                <p className="text-xs text-primary">{q.status}</p>
                <p className="mt-1 text-[10px] uppercase text-zinc-500">{q.when}</p>
              </div>
            ))}
            <Button variant="secondary" className="w-full" type="button" asChild>
              <Link href="/chat">Open messages</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Bookmark className="h-4 w-4 text-primary" />
              Saved comparisons
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {savedCmp.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Save a comparison from the compare page — it appears here for one-tap reload.
              </p>
            ) : (
              savedCmp.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.carIds.length} cars · {s.savedAt}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" type="button" onClick={() => loadComparison(s.carIds)}>
                      Load
                    </Button>
                    <Button size="sm" variant="ghost" type="button" onClick={() => removeCmp(s.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60">
          <CardHeader>
            <CardTitle className="text-foreground">Recently viewed</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCars.length === 0 ? (
              <p className="text-sm text-muted-foreground">Open a few listings — we&apos;ll replay them here.</p>
            ) : (
              <ul className="space-y-2">
                {recentCars.slice(0, 6).map((c) => (
                  <li key={c.id}>
                    <Link href={carDetailPath(c)} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-secondary/50">
                      <span className="text-sm text-foreground">
                        {c.brand} {c.model}
                      </span>
                      <span className="text-xs text-primary">{formatINR(c.price)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 border-border bg-card/60">
        <CardHeader>
          <CardTitle className="text-foreground">Match preferences</CardTitle>
          <p className="text-sm text-muted-foreground">
            Drives the “AI match %” on detail pages — purely client-side scoring for your session.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <Label>Budget ceiling</Label>
              <span className="text-sm text-primary">{formatINR(budgetMax)}</span>
            </div>
            <Slider
              className="mt-3"
              min={500000}
              max={6000000}
              step={50000}
              value={[budgetMax]}
              onValueChange={(v) => setBudget(v[0] ?? budgetMax)}
            />
          </div>
          <div>
            <Label className="mb-2 block">Preferred fuels</Label>
            <div className="flex flex-wrap gap-2">
              {["Petrol", "Diesel", "Electric", "Hybrid", "CNG"].map((f) => (
                <Button
                  key={f}
                  type="button"
                  size="sm"
                  variant={preferredFuels.includes(f) ? "default" : "outline"}
                  className={preferredFuels.includes(f) ? "" : "border-primary/20"}
                  onClick={() => toggleFuel(f)}
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Body types</Label>
            <div className="flex flex-wrap gap-2">
              {bodyTypes.map((b) => (
                <Button
                  key={b}
                  type="button"
                  size="sm"
                  variant={prefBodies.includes(b) ? "default" : "outline"}
                  className={prefBodies.includes(b) ? "" : "border-primary/20"}
                  onClick={() => toggleBody(b)}
                >
                  {b}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8 border-border bg-card/60">
        <CardHeader>
          <CardTitle className="text-foreground">Profile settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="dashboard-profile-name" className="text-xs text-muted-foreground">
              Full name
            </Label>
            <Input
              id="dashboard-profile-name"
              className="mt-1 bg-secondary/50"
              defaultValue="Kapil Sharma"
            />
          </div>
          <div>
            <Label htmlFor="dashboard-profile-phone" className="text-xs text-muted-foreground">
              Phone
            </Label>
            <Input
              id="dashboard-profile-phone"
              className="mt-1 bg-secondary/50"
              defaultValue="+91 · · · · · · · · · ·"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="button" onClick={() => toast.success("Profile saved")}>
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
