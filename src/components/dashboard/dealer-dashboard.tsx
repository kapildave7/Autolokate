"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Bell, CarFront, Eye, PhoneCall } from "lucide-react";
import { cars } from "@/data";
import { RemoteImageWithFallback } from "@/components/ui/remote-image";
import { formatINR } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DealerChartsPanel = dynamic(
  () => import("@/components/dashboard/dealer-charts").then((m) => m.DealerChartsPanel),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl border border-border bg-secondary/20" />
        ))}
      </div>
    ),
  }
);

const bars = [
  { label: "Mon", v: 42 },
  { label: "Tue", v: 58 },
  { label: "Wed", v: 49 },
  { label: "Thu", v: 72 },
  { label: "Fri", v: 65 },
  { label: "Sat", v: 88 },
  { label: "Sun", v: 54 },
];

const leads = [
  { name: "Aarav K.", car: "Hyundai Creta", when: "12m ago", channel: "Call" },
  { name: "Diya S.", car: "Tata Nexon EV", when: "1h ago", channel: "WhatsApp" },
  { name: "Vihaan P.", car: "Kia Seltos", when: "3h ago", channel: "Form" },
];

export function DealerDashboard() {
  const max = Math.max(...bars.map((b) => b.v));
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dealer dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Overview, listings, and lead velocity — sample analytics for your overview.
          </p>
        </div>
        {/* Marketplace listing flow disabled — see middleware */}
        <Button variant="outline" asChild>
          <Link href="/companies">
            <CarFront className="h-4 w-4" />
            Public dealer profile
          </Link>
        </Button>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Active listings", "34", "+4 this week"],
          ["Profile views", "12.4k", "+18% vs last week"],
          ["Qualified leads", "128", "32 hot"],
          ["Conversion", "4.2%", "views → test drive"],
        ].map(([t, v, s]) => (
          <Card key={t} className="border-border bg-card/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{v}</p>
              <p className="mt-1 text-xs text-primary">{s}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10">
        <DealerChartsPanel />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <Card className="border-border bg-card/60 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground">Quick traffic pulse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-end gap-2">
              {bars.map((b, i) => (
                <motion.div
                  key={b.label}
                  className="flex flex-1 flex-col items-center gap-2"
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  transition={{ delay: i * 0.05 }}
                >
                  <motion.div
                    className="w-full rounded-t-lg bg-gradient-to-t from-primary to-[#fb923c]"
                    initial={{ height: 0 }}
                    animate={{ height: `${(b.v / max) * 160}px` }}
                    transition={{ duration: 0.5, delay: i * 0.06 }}
                  />
                  <span className="text-[10px] text-muted-foreground">{b.label}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <PhoneCall className="h-4 w-4 text-primary" />
              Recent leads
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {leads.map((l) => (
              <div key={l.name} className="rounded-xl border border-border bg-secondary/40 p-3">
                <p className="text-sm font-semibold text-foreground">{l.name}</p>
                <p className="text-xs text-muted-foreground">{l.car}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] uppercase text-zinc-500">
                  <span>{l.channel}</span>
                  <span>{l.when}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-10 border-border bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Bell className="h-4 w-4 text-primary" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {[
            { t: "Price updated", d: "Creta diesel — you undercut market by ₹18k", when: "12m" },
            { t: "Lead hot", d: "Nexon EV — buyer requested finance pre-approval", when: "34m" },
            { t: "Policy", d: "New photography guidelines for certified listings", when: "1d" },
          ].map((n) => (
            <div key={n.t} className="rounded-xl border border-border bg-secondary/30 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">{n.t}</p>
              <p className="mt-2 text-sm text-muted-foreground">{n.d}</p>
              <p className="mt-3 text-[10px] text-zinc-500">{n.when} ago</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-10 border-border bg-card/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground">My listings (sample)</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/compare">
              View compare
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="pb-3 pr-3">Photo</th>
                <th className="pb-3">Vehicle</th>
                <th className="pb-3">Price</th>
                <th className="pb-3">Views</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {cars.slice(0, 6).map((c, i) => (
                <tr key={c.id} className="border-b border-border/60">
                  <td className="py-2 pr-3 align-middle">
                    <div className="relative h-11 w-16 overflow-hidden rounded-lg border border-border bg-secondary/40">
                      <RemoteImageWithFallback
                        src={c.images[0]}
                        alt={`${c.brand} ${c.model}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  </td>
                  <td className="py-3 font-medium text-foreground">
                    {c.brand} {c.model}
                  </td>
                  <td className="py-3 text-primary">{formatINR(c.price)}</td>
                  <td className="py-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {920 + i * 174}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="rounded-full bg-brand-green-mid/20 px-2 py-0.5 text-xs text-brand-green-mid">
                      Live
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
