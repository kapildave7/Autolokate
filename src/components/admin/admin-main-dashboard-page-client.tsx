"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/client/api-client";
import { getAdminDashboardStats } from "@/lib/client/admin-dashboard-api";

function formatCurrency(value: unknown): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function AdminMainDashboardPageClient() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const response = await getAdminDashboardStats();
      setStats(response);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to load dashboard stats.";
      toast.error(message);
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);
  const usersCount = (stats?.total_users as number) ?? (stats?.users as number) ?? 0;
  const bookingsCount = (stats?.total_bookings as number) ?? (stats?.bookings as number) ?? 0;
  const revenue = (stats?.total_revenue as number) ?? (stats?.revenue as number) ?? null;
  const scrapeStatus = String(stats?.scrape_status ?? "unknown");

  async function onRefresh() {
    await fetchStats();
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminDashboardHeader
        title="Dashboard"
        subtitle="Key metrics, user insights, and platform overview."
        onRefresh={onRefresh}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-purple-100 bg-white">
          <CardHeader className="pb-2">
            <CardDescription>Total users</CardDescription>
            <CardTitle className="text-3xl text-purple-700">{loadingStats ? "..." : usersCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-purple-100 bg-white">
          <CardHeader className="pb-2">
            <CardDescription>Total bookings</CardDescription>
            <CardTitle className="text-3xl text-purple-700">{loadingStats ? "..." : bookingsCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-purple-100 bg-white">
          <CardHeader className="pb-2">
            <CardDescription>Revenue</CardDescription>
            <CardTitle className="text-3xl text-purple-700">{loadingStats ? "..." : formatCurrency(revenue)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-purple-100 bg-white">
          <CardHeader className="pb-2">
            <CardDescription>Scrape status</CardDescription>
            <div className="pt-2">
              <Badge variant={scrapeStatus === "active" ? "default" : "secondary"}>{loadingStats ? "..." : scrapeStatus}</Badge>
            </div>
          </CardHeader>
        </Card>
      </div>

    </div>
  );
}
