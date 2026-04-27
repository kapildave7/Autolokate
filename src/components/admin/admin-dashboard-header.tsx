"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type AdminDashboardHeaderProps = {
  title: string;
  subtitle: string;
  onRefresh?: () => void | Promise<void>;
};

export function AdminDashboardHeader({ title, subtitle, onRefresh }: AdminDashboardHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{title}</h1>
          <p className="text-sm text-zinc-600">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh ? (
            <Button variant="outline" className="border-purple-200" onClick={() => void onRefresh()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
