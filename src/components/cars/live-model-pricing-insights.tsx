"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Fuel, Loader2, PiggyBank, Sparkles, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatINR } from "@/lib/utils";
import {
  getEmiQuote,
  getEvSubsidies,
  getFuelPriceHistory,
  getFuelPrices,
  getResaleEstimate,
  getTco,
  type TcoBreakdown,
} from "@/lib/client/prices-api";
import { TcoCostBreakdownBars } from "@/components/cars/tco-cost-breakdown-bars";
import { TCO_CITIES, matchPreferenceCity } from "@/lib/tco-cities";

function formatEvRow(row: unknown): string | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const parts: string[] = [];
  const title = r.title ?? r.name ?? r.scheme ?? r.region;
  if (title != null && String(title).trim()) parts.push(String(title).trim());
  const amt = r.amount ?? r.subsidy ?? r.value;
  if (typeof amt === "number") parts.push(formatINR(amt));
  else if (amt != null && String(amt).trim()) parts.push(String(amt));
  const note = r.description ?? r.notes;
  if (note != null && String(note).trim()) parts.push(String(note).trim());
  return parts.length ? parts.join(" · ") : JSON.stringify(row);
}

function TcoBreakdownRows({ tco, deep }: { tco: TcoBreakdown; deep: boolean }) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "City", value: tco.city },
    {
      label: "Period & usage",
      value: `${tco.years} years · ${tco.km_per_year.toLocaleString("en-IN")} km/year`,
    },
    { label: "Purchase price", value: formatINR(tco.purchase_price) },
    { label: "Fuel cost", value: formatINR(tco.fuel_cost) },
    { label: "Insurance cost", value: formatINR(tco.insurance_cost) },
    { label: "Maintenance cost", value: formatINR(tco.maintenance_cost) },
    { label: "Depreciation", value: formatINR(tco.depreciation) },
  ];
  const labelCls = deep ? "text-zinc-400" : "text-muted-foreground";
  const valueCls = deep ? "text-zinc-100" : "text-foreground";
  const rowBorder = deep ? "border-white/10" : "border-border/60";
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border",
        deep ? "border-white/10 bg-black/20" : "border-[#E5E7EB] bg-[#FAFBFC]/80"
      )}
    >
      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className={cn("border-b last:border-b-0", rowBorder)}>
              <td className={cn("w-[min(52%,14rem)] px-3 py-2.5 align-top font-medium sm:px-4", labelCls)}>{r.label}</td>
              <td className={cn("px-3 py-2.5 text-right font-semibold tabular-nums wrap-anywhere sm:px-4", valueCls)}>
                {r.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const EMI_RATE = 9.5;
const EMI_MONTHS = 60;

function formatFuelChip(row: unknown): { title: string; detail: string } | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const fuel = String(r.fuel_type ?? r.fuel ?? r.name ?? "").trim() || "Fuel";
  const price = r.price ?? r.price_per_litre ?? r.rate ?? r.amount;
  let detail = "";
  if (typeof price === "number") {
    detail = formatINR(price);
    const unit = r.unit;
    if (unit && typeof unit === "string") detail += ` / ${unit}`;
  } else if (price != null) detail = String(price);
  else detail = "—";
  return { title: fuel, detail };
}

type Props = {
  variantId: string | undefined;
  /** @deprecated Kept for call-site compatibility; EMI uses TCO purchase_price only. */
  exShowroom?: number | null;
  fuelTypeLabel: string;
  /** Sync initial city from discovery questionnaire when it matches supported cities. */
  preferenceCity?: string;
  /** Optional API fuel_type filter (e.g. petrol, diesel, cng). */
  fuelTypeFilter?: string;
  /** Rich dark panel for use inside a deep section (e.g. pricing band). */
  tone?: "default" | "deep";
  /** Controlled city (e.g. lifted to model page so hero + variants stay in sync). */
  tcoCity?: string;
  onTcoCityChange?: (city: string) => void;
  /** City used in pricing API query keys — use debounced value from parent so requests align after city changes. */
  tcoCityForApi?: string;
};

export function LiveModelPricingInsights({
  variantId,
  fuelTypeLabel,
  preferenceCity,
  fuelTypeFilter,
  tone = "default",
  tcoCity: tcoCityControlled,
  onTcoCityChange,
  tcoCityForApi,
}: Props) {
  const deep = tone === "deep";
  const [internalCity, setInternalCity] = useState("Mumbai");
  const tcoCity = tcoCityControlled ?? internalCity;
  const setTcoCity = onTcoCityChange ?? setInternalCity;
  const apiCity = tcoCityForApi ?? tcoCity;
  const [resaleYear, setResaleYear] = useState("3");

  useEffect(() => {
    if (tcoCityControlled != null) return;
    const matched = matchPreferenceCity(preferenceCity);
    if (matched) setInternalCity(matched);
  }, [preferenceCity, tcoCityControlled]);

  const fuelQueryParams = useMemo(() => {
    const ft = fuelTypeFilter?.trim().toLowerCase();
    if (!ft || ft === "petrol" || ft === "diesel" || ft === "cng" || ft === "lpg") {
      return ft ? { fuel_type: ft } : undefined;
    }
    return undefined;
  }, [fuelTypeFilter]);

  const { data: tco, isPending: tcoLoading, isError: tcoError } = useQuery({
    queryKey: ["prices-tco", variantId, apiCity],
    queryFn: ({ signal }) => getTco(variantId!, apiCity, { signal }),
    enabled: Boolean(variantId && apiCity),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });

  const principal = useMemo(() => {
    const fromApi = tco?.purchase_price;
    if (typeof fromApi === "number" && fromApi >= 10_000) return fromApi;
    return null;
  }, [tco?.purchase_price]);

  const { data: emi, isPending: emiLoading } = useQuery({
    queryKey: ["prices-emi", principal, EMI_RATE, EMI_MONTHS],
    queryFn: () =>
      getEmiQuote({
        principal: principal!,
        rate: EMI_RATE,
        tenure_months: EMI_MONTHS,
      }),
    enabled: Boolean(principal),
    staleTime: 300_000,
  });

  const resaleYearNum = Number(resaleYear);
  const { data: resale, isPending: resaleLoading } = useQuery({
    queryKey: ["prices-resale", variantId, resaleYearNum],
    queryFn: () => getResaleEstimate(variantId!, { year: resaleYearNum }),
    enabled: Boolean(variantId) && Number.isFinite(resaleYearNum) && resaleYearNum >= 1,
    staleTime: 300_000,
  });

  const isEv = useMemo(() => /electric|ev\b/i.test(fuelTypeLabel), [fuelTypeLabel]);

  const { data: evRows = [] } = useQuery({
    queryKey: ["prices-ev-subsidies"],
    queryFn: () => getEvSubsidies(),
    enabled: isEv,
    staleTime: 300_000,
  });

  const { data: fuelRows = [], isPending: fuelLoading } = useQuery({
    queryKey: ["prices-fuel", apiCity, fuelQueryParams?.fuel_type ?? ""],
    queryFn: () => getFuelPrices(apiCity, fuelQueryParams),
    enabled: Boolean(apiCity),
    staleTime: 3_600_000,
  });

  const { data: fuelHistory = [] } = useQuery({
    queryKey: ["prices-fuel-history", apiCity],
    queryFn: () => getFuelPriceHistory(apiCity),
    enabled: Boolean(apiCity),
    staleTime: 3_600_000,
  });

  const fuelChips = useMemo(
    () => fuelRows.map(formatFuelChip).filter(Boolean) as Array<{ title: string; detail: string }>,
    [fuelRows]
  );

  const evLines = useMemo(() => evRows.map(formatEvRow).filter(Boolean) as string[], [evRows]);

  const cardCls = deep
    ? "border-white/10 bg-zinc-900/55 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.65)] ring-1 ring-white/5 backdrop-blur-md"
    : "border-[#E5E7EB] bg-white shadow-[0_24px_64px_-40px_rgba(15,23,42,0.2)] ring-1 ring-[#1E3A8A]/[0.06]";

  const muted = deep ? "text-zinc-400" : "text-muted-foreground";
  const heading = deep ? "text-zinc-100" : "text-foreground";
  const accent = deep ? "text-emerald-400/95" : "text-primary";
  const panelInner = deep ? "border-white/10 bg-zinc-950/40" : "border-[#E5E7EB] bg-white shadow-sm";
  const chip = deep ? "border-white/10 bg-white/[0.06] text-zinc-100" : "border-border bg-card";
  const selectTrigger = deep
    ? "h-11 min-h-11 border-white/15 bg-white/5 text-base text-zinc-100 hover:bg-white/10"
    : cn(
        "h-11 min-h-11 rounded-xl border-2 border-[#E5E7EB] bg-white px-3 text-[0.9375rem] font-semibold text-[#111827]",
        "shadow-sm transition-[border-color,box-shadow] duration-200",
        "hover:border-[#93C5FD] hover:shadow-md",
        "focus:outline-none focus:ring-0 focus-visible:border-[#1E3A8A]/45 focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/18",
        "data-[state=open]:border-[#1E3A8A]/40 data-[state=open]:shadow-md"
  );

  if (!variantId) return null;

  return (
    <Card className={cn("relative overflow-hidden rounded-2xl sm:rounded-3xl", cardCls)}>
      {!deep ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-[#1E3A8A] via-[#059669] to-[#F97316]"
          aria-hidden
        />
      ) : null}
      {!deep ? (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(30,58,138,0.06),transparent_55%),radial-gradient(ellipse_50%_40%_at_0%_100%,rgba(16,185,129,0.05),transparent_50%)]"
          aria-hidden
        />
      ) : null}
      <CardContent className={cn("relative p-5 sm:p-7 lg:p-8", !deep && "pt-6 sm:pt-8")}>
        <div className="flex flex-wrap items-start gap-3 sm:gap-4">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-sm sm:h-12 sm:w-12",
              deep
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                : "border-[#1E3A8A]/20 bg-linear-to-br from-[#EEF2FF] to-white text-[#1E3A8A]"
            )}
          >
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className={cn("text-xs font-bold uppercase tracking-[0.16em] sm:text-sm", accent)}>Ownership &amp; finance</p>
            <p className={cn("mt-1.5 font-display text-lg font-bold leading-tight tracking-tight sm:text-xl", heading)}>
              Real numbers for this trim
            </p>
            <p className={cn("mt-2 max-w-2xl text-sm leading-snug sm:text-[0.9375rem]", muted)}>
              EMI, 5-year cost, fuel rates, and resale — for your city and ownership horizon. Change city or year to recalculate.
            </p>
          </div>
        </div>

        <div
          className={cn(
            "mt-4 flex flex-wrap items-end gap-3 rounded-xl border p-3 sm:mt-5 sm:gap-4 sm:p-4",
            deep ? "border-white/10 bg-white/[0.04]" : "border-[#E5E7EB] bg-[#F8FAFC]/90"
          )}
        >
          <div className="min-w-[10rem] flex-1 space-y-1 sm:min-w-[11rem]">
            <Label htmlFor="tco-city" className={cn("text-xs font-semibold uppercase tracking-wide sm:text-[0.8125rem]", muted)}>
              City
            </Label>
            <Select value={tcoCity} onValueChange={setTcoCity}>
              <SelectTrigger id="tco-city" className={selectTrigger}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TCO_CITIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[9rem] flex-1 space-y-1 sm:min-w-[10rem]">
            <Label htmlFor="resale-year" className={cn("text-xs font-semibold uppercase tracking-wide sm:text-[0.8125rem]", muted)}>
              Resale horizon
            </Label>
            <Select value={resaleYear} onValueChange={setResaleYear}>
              <SelectTrigger id="resale-year" className={selectTrigger}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["1", "2", "3", "4", "5"].map((y) => (
                  <SelectItem key={y} value={y}>
                    Year {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:mt-5 lg:grid-cols-3 lg:gap-4 xl:gap-5">
          {/* Fuel */}
          <div
            className={cn(
              "flex flex-col overflow-hidden rounded-xl border shadow-sm",
              deep ? "border-white/10 bg-zinc-950/35" : "border-[#E5E7EB] bg-white",
              !deep && "ring-1 ring-[#111827]/[0.04]"
            )}
          >
            <div className={cn("h-1 w-full shrink-0", deep ? "bg-emerald-500/50" : "bg-linear-to-r from-slate-500 to-slate-600")} aria-hidden />
            <div className="flex flex-1 flex-col p-4 sm:p-4">
              <p className={cn("flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] sm:text-xs", muted)}>
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", deep ? "bg-white/10" : "bg-slate-100")}>
                  <Fuel className="h-4 w-4 opacity-90" aria-hidden />
                </span>
                <span className="min-w-0 leading-tight">
                  Fuel · {apiCity}
            {fuelQueryParams?.fuel_type ? ` · ${fuelQueryParams.fuel_type}` : ""}
                </span>
          </p>
              <div className="mt-3 min-h-0 flex-1">
          {fuelLoading ? (
                  <Loader2 className={cn("h-5 w-5 animate-spin", muted)} />
          ) : fuelChips.length ? (
                  <div className="flex flex-wrap gap-1.5">
              {fuelChips.map((c) => (
                      <span key={`${c.title}-${c.detail}`} className={cn("rounded-lg border px-2.5 py-1.5 text-xs sm:text-sm", chip)}>
                        <span className={cn("font-semibold", heading)}>{c.title}</span>{" "}
                        <span className={muted}>{c.detail}</span>
                </span>
              ))}
            </div>
          ) : (
                  <p
                    className={cn(
                      "rounded-lg border px-2.5 py-2 text-xs leading-relaxed sm:text-sm",
                      deep ? "border-amber-500/25 bg-amber-500/10 text-amber-100/90" : "border-amber-200/80 bg-amber-50 text-amber-950/90"
                    )}
                  >
                    No pump prices for this city{fuelQueryParams?.fuel_type ? ` / ${fuelQueryParams.fuel_type}` : ""} right now.
                  </p>
          )}
          {fuelHistory.length > 0 ? (
                  <p className={cn("mt-2 text-xs leading-relaxed sm:text-sm", muted)}>
                    {fuelHistory.length} recent price point{fuelHistory.length === 1 ? "" : "s"} for {apiCity}.
            </p>
          ) : null}
              </div>
            </div>
        </div>

          {/* EMI */}
          <div
            className={cn(
              "flex flex-col overflow-hidden rounded-xl border shadow-sm",
              deep ? "border-white/10 bg-zinc-950/35" : "border-[#E5E7EB] bg-white",
              !deep && "ring-1 ring-[#111827]/[0.04]"
            )}
          >
            <div className={cn("h-1 w-full shrink-0", deep ? "bg-orange-500/60" : "bg-linear-to-r from-[#F97316] to-[#ea580c]")} aria-hidden />
            <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-4">
              <p className={cn("flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] sm:text-xs", muted)}>
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", deep ? "bg-white/10" : "bg-[#FFF7ED]")}>
                  <PiggyBank className={cn("h-4 w-4", deep ? "text-orange-300" : "text-[#C2410C]")} aria-hidden />
                </span>
                <span>
                  EMI · {EMI_RATE}% · {EMI_MONTHS} mo
                </span>
              </p>
              <div className="mt-3 min-h-0 flex-1">
            {principal ? (
              emiLoading ? (
                    <Loader2 className={cn("h-5 w-5 animate-spin", muted)} />
              ) : emi ? (
                <>
                      <p className={cn("font-display text-2xl font-bold tabular-nums tracking-tight sm:text-[1.65rem]", deep ? "text-orange-200" : "text-[#C2410C]")}>
                        {formatINR(emi.monthly_emi)}
                        <span className={cn("ml-1 text-sm font-semibold sm:text-base", muted)}>/mo</span>
                      </p>
                      <p className={cn("mt-2 text-xs leading-relaxed sm:text-sm", muted)}>
                        Payable {formatINR(emi.total_payable)} · interest {formatINR(emi.total_interest)}
                  </p>
                </>
              ) : null
            ) : (
                  <p className={cn("text-sm leading-relaxed", muted)}>
                    Purchase price (₹10,000+ loan) required for EMI estimate.
                  </p>
                )}
              </div>
              <p
                className={cn(
                  "mt-3 border-t pt-2.5 text-xs leading-relaxed sm:text-sm",
                  deep ? "border-white/10" : "border-[#E5E7EB]",
                  muted
                )}
              >
                Illustrative — actual rates vary by lender.
              </p>
            </div>
          </div>

          {/* Resale */}
          <div
            className={cn(
              "flex flex-col overflow-hidden rounded-xl border shadow-sm",
              deep ? "border-white/10 bg-zinc-950/35" : "border-[#E5E7EB] bg-white",
              !deep && "ring-1 ring-[#111827]/[0.04]"
            )}
          >
            <div className={cn("h-1 w-full shrink-0", deep ? "bg-blue-400/50" : "bg-linear-to-r from-[#1E3A8A] to-[#2563EB]")} aria-hidden />
            <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-4">
              <p className={cn("flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] sm:text-xs", muted)}>
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", deep ? "bg-white/10" : "bg-[#EEF2FF]")}>
                  <TrendingDown className={cn("h-4 w-4", deep ? "text-blue-300" : "text-[#1E3A8A]")} aria-hidden />
                </span>
                <span>Resale · year {resaleYear}</span>
              </p>
              <div className="mt-3 min-h-0 flex-1">
                {resaleLoading ? (
                  <Loader2 className={cn("h-5 w-5 animate-spin", muted)} />
                ) : resale ? (
                  <>
                    <p className={cn("font-display text-2xl font-bold tabular-nums tracking-tight sm:text-[1.65rem]", deep ? "text-blue-200" : "text-[#1E3A8A]")}>
                      {formatINR(resale.estimated_value)}
                    </p>
                    <p className={cn("mt-2 text-xs sm:text-sm", muted)}>Depreciation ~{resale.depreciation_pct}%</p>
                  </>
                ) : (
                  <p className={cn("text-sm", muted)}>No resale estimate for this selection.</p>
                )}
              </div>
              <p
                className={cn(
                  "mt-3 border-t pt-2.5 text-xs leading-relaxed sm:text-sm",
                  deep ? "border-white/10" : "border-[#E5E7EB]",
                  muted
                )}
              >
                Market values vary — guide only.
              </p>
            </div>
          </div>
          </div>

        <div className="mt-5 space-y-4 sm:mt-6">
          <div className={cn("rounded-2xl border p-4 sm:p-5", panelInner)}>
            <p className={cn("text-sm font-semibold uppercase tracking-wide", muted)}>5-year total cost · {apiCity}</p>
            {tcoLoading ? (
              <Loader2 className={cn("mt-3 h-5 w-5 animate-spin", muted)} />
            ) : tcoError ? (
              <p className={cn("mt-3 text-sm", muted)}>We couldn&apos;t load TCO for this variant. Try another city.</p>
            ) : tco ? (
              <>
                {!deep ? <TcoCostBreakdownBars tco={tco} className="mt-3" /> : null}
                <p className={cn("mt-3 text-sm leading-snug", muted)}>
                  Same scope as the chart{deep ? "" : " above"}: {tco.city} · {tco.years} years ·{" "}
                  {tco.km_per_year.toLocaleString("en-IN")} km/year.
                </p>
                <TcoBreakdownRows tco={tco} deep={deep} />
              </>
            ) : null}
          </div>
        </div>

        {isEv ? (
          <div className={cn("mt-6 rounded-2xl border border-dashed p-4 sm:p-5", deep ? "border-white/15 bg-black/20" : "border-border/80 bg-muted/10")}>
            <p className={cn("text-sm font-semibold uppercase tracking-wide", muted)}>EV incentives</p>
            {evLines.length === 0 ? (
              <p className={cn("mt-2 text-sm leading-relaxed", muted)}>
                No national subsidy rows are available for this view. Check with dealers for state-specific benefits.
              </p>
            ) : (
              <ul className={cn("mt-3 space-y-2 text-sm", deep ? "text-zinc-200" : "text-foreground")}>
                {evLines.map((line, i) => (
                  <li key={i} className="flex gap-2 leading-relaxed">
                    <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", deep ? "bg-emerald-400/80" : "bg-primary")} />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
