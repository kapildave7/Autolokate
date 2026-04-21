"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const traffic = [
  { d: "Mon", views: 4200, leads: 42 },
  { d: "Tue", views: 5100, leads: 51 },
  { d: "Wed", views: 4800, leads: 47 },
  { d: "Thu", views: 6200, leads: 63 },
  { d: "Fri", views: 5900, leads: 58 },
  { d: "Sat", views: 7100, leads: 74 },
  { d: "Sun", views: 4600, leads: 44 },
];

const funnel = [
  { stage: "Listing views", value: 100 },
  { stage: "Detail views", value: 58 },
  { stage: "Leads", value: 22 },
  { stage: "Test drives", value: 9 },
  { stage: "Token paid", value: 3 },
];

const perf = [
  { name: "Creta", views: 2400, saves: 180 },
  { name: "Nexon", views: 2100, saves: 210 },
  { name: "Seltos", views: 1900, saves: 140 },
  { name: "EV6", views: 980, saves: 92 },
];

const COLORS = ["#f97316", "#fb923c", "#ea580c", "#f59e0b", "#fdba74"];

export function DealerChartsPanel() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold text-foreground">Traffic & leads</p>
        <p className="text-xs text-muted-foreground">Weekly series — updates with your warehouse metrics.</p>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={traffic} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.08)" />
              <XAxis dataKey="d" stroke="#94a3b8" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  boxShadow: "0 8px 24px -8px rgba(15, 23, 42, 0.12)",
                }}
                labelStyle={{ color: "#0f172a", fontWeight: 600 }}
              />
              <Area type="monotone" dataKey="views" stroke="#f97316" fill="url(#fillViews)" strokeWidth={2} />
              <Area type="monotone" dataKey="leads" stroke="#6366f1" fill="transparent" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold text-foreground">Lead funnel</p>
        <p className="text-xs text-muted-foreground">Relative conversion by stage (indexed).</p>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnel} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.08)" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="stage"
                width={100}
                stroke="#94a3b8"
                tick={{ fill: "#64748b", fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  boxShadow: "0 8px 24px -8px rgba(15, 23, 42, 0.12)",
                }}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {funnel.map((_, i) => (
                  <Cell key={funnel[i].stage} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 lg:col-span-2">
        <p className="text-sm font-semibold text-foreground">Listing performance</p>
        <p className="text-xs text-muted-foreground">Views vs saves by top SKU (sample).</p>
        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={perf} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.08)" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  boxShadow: "0 8px 24px -8px rgba(15, 23, 42, 0.12)",
                }}
              />
              <Bar dataKey="views" fill="#f97316" radius={[6, 6, 0, 0]} />
              <Bar dataKey="saves" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
