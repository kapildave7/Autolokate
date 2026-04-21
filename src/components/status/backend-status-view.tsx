import Link from "next/link";
import { Activity, Database, HardDrive, Server } from "lucide-react";
import { CustomerPageShell } from "@/components/shared/customer-page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchHealthLiveness, fetchHealthReadiness } from "@/lib/health/health-public-fetch";
import { cn } from "@/lib/utils";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function okBadge(ok: boolean | undefined) {
  if (ok === undefined) return <Badge variant="secondary">—</Badge>;
  return (
    <Badge
      variant="outline"
      className={cn(
        ok
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
          : "border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-100"
      )}
    >
      {ok ? "OK" : "Down"}
    </Badge>
  );
}

export async function BackendStatusView() {
  const [live, ready] = await Promise.all([fetchHealthLiveness(), fetchHealthReadiness()]);

  return (
    <CustomerPageShell
      eyebrow="Operations"
      title="API status"
      lead="Live checks against the Autolokate backend (staging URL from your env). Use for debugging connectivity — not a SLA dashboard."
      maxWidthClass="max-w-3xl"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Activity className="h-4 w-4 text-primary" aria-hidden />
                Liveness
              </CardTitle>
              {live ? okBadge(live.status === "ok") : <Badge variant="outline" className="border-red-500/50 text-red-700">Unreachable</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">GET /health</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {live ? (
              <>
                <p>
                  <span className="text-muted-foreground">Status</span>{" "}
                  <span className="font-medium text-foreground">{live.status}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Timestamp</span>{" "}
                  <span className="tabular-nums text-foreground">{formatTime(live.timestamp)}</span>
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">Could not reach the liveness endpoint.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Server className="h-4 w-4 text-primary" aria-hidden />
                Readiness
              </CardTitle>
              {ready ? okBadge(ready.status === "ready") : <Badge variant="outline" className="border-red-500/50 text-red-700">Unreachable</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">GET /health/ready</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {ready ? (
              <>
                <p>
                  <span className="text-muted-foreground">Status</span>{" "}
                  <span className="font-medium text-foreground">{ready.status}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Timestamp</span>{" "}
                  <span className="tabular-nums text-foreground">{formatTime(ready.timestamp)}</span>
                </p>
                {ready.checks ? (
                  <ul className="mt-3 space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3">
                    <li className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Database className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Redis
                      </span>
                      {okBadge(ready.checks.redis_connected)}
                    </li>
                    <li className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Database className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Supabase
                      </span>
                      {okBadge(ready.checks.supabase_reachable)}
                    </li>
                    {typeof ready.checks.l1_cache_size === "number" ? (
                      <li className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <HardDrive className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          L1 cache size
                        </span>
                        <span className="font-mono text-xs text-foreground">{ready.checks.l1_cache_size}</span>
                      </li>
                    ) : null}
                  </ul>
                ) : null}
              </>
            ) : (
              <p className="text-muted-foreground">Could not reach the readiness endpoint.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        <Link href="/" className="text-primary underline-offset-4 hover:underline">
          Back to home
        </Link>
      </p>
    </CustomerPageShell>
  );
}
