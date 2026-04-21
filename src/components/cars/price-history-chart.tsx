"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PriceHistoryPoint } from "@/data/types";
import { formatINR } from "@/lib/utils";

const stroke = "#f97316";

export function PriceHistoryChart({ data }: { data: PriceHistoryPoint[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="phFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.08)" vertical={false} />
          <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: "#64748b", fontSize: 11 }} />
          <YAxis
            stroke="#94a3b8"
            tick={{ fill: "#64748b", fontSize: 10 }}
            tickFormatter={(v) => `${Math.round(v / 100000)}L`}
          />
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              boxShadow: "0 8px 24px -8px rgba(15, 23, 42, 0.12)",
            }}
            labelStyle={{ color: "#0f172a", fontWeight: 600 }}
            formatter={(value) => [formatINR(Number(value ?? 0)), "Ask price"]}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={stroke}
            strokeWidth={2}
            fill="url(#phFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
