"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Scale, X } from "lucide-react";
import { compareVariantsList } from "@/lib/client/catalogue-api";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RemoteImageWithFallback } from "@/components/ui/remote-image";
import { useCompareStore } from "@/stores/compare-store";
import { catalogueComparePath, comparePathForIds } from "@/lib/seo/paths";
import { GA_CATEGORIES, trackEvent } from "@/lib/analytics";

export function StickyCompareDock() {
  const pathname = usePathname();
  const variantIds = useCompareStore((s) => s.variantIds);
  const removeVariant = useCompareStore((s) => s.removeVariant);

  const { data: variants = [] } = useQuery({
    queryKey: ["catalogue-compare-dock", variantIds.join("|")],
    queryFn: () => compareVariantsList(variantIds),
    enabled: variantIds.length > 0,
    staleTime: 60_000,
  });

  const byId = new Map(variants.map((v) => [String(v.id), v]));

  if (pathname === "/book-expert") return null;

  return (
    <AnimatePresence>
      {variantIds.length > 0 ? (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="fixed bottom-0 left-0 right-0 z-45 border-t border-border bg-background/98 px-3 py-2 pb-safe shadow-[0_-4px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:px-4 sm:py-3"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Scale className="h-4 w-4 shrink-0 text-[#14532d] dark:text-[#166534]" />
              <span className="min-w-0">
                Compare · {variantIds.length}/3 variants
              </span>
            </div>
            <div className="flex flex-1 flex-wrap items-center justify-center gap-2 sm:justify-end">
              {variantIds.map((id) => {
                const row = byId.get(id);
                const title = row
                  ? [row.brand_name, row.model_name].filter(Boolean).join(" ") || "Variant"
                  : "Loading…";
                const sub = row ? String(row.variant_name ?? row.name ?? "") : id.slice(0, 8) + "…";
                const img = row && typeof row.image_url === "string" ? row.image_url : "";
                const price = row?.ex_showroom_price ?? row?.min_price;
                const priceLabel =
                  typeof price === "number" && price > 0 ? formatINR(price) : row ? "—" : "";

                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 py-1 pl-1 pr-2"
                  >
                    <div className="relative h-10 w-14 overflow-hidden rounded-lg bg-muted">
                      {img ? (
                        <RemoteImageWithFallback src={img} alt="" fill className="object-cover" sizes="56px" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 max-w-[140px]">
                      <p className="truncate text-xs font-medium text-foreground">{title}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{sub}</p>
                      {priceLabel ? <p className="text-[10px] font-semibold text-foreground">{priceLabel}</p> : null}
                    </div>
                    <button
                      type="button"
                      className="touch-target inline-flex items-center justify-center rounded-lg text-muted-foreground hover:bg-background hover:text-foreground"
                      aria-label="Remove"
                      onClick={() => {
                        trackEvent("compare_tray_toggle", {
                          event_category: GA_CATEGORIES.compare,
                          action: "remove",
                          source: "sticky_dock",
                          variant_id: id,
                        });
                        removeVariant(id);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                className="h-11 min-h-11 flex-1 sm:h-9 sm:min-h-9 sm:flex-initial"
                disabled={variantIds.length < 2}
                asChild
              >
                <Link
                  href={variantIds.length >= 2 ? catalogueComparePath(variantIds) : "/compare/catalogue"}
                  onClick={() =>
                    trackEvent("cta_click", {
                      event_category: GA_CATEGORIES.compare,
                      event_label: "open_catalogue_table_from_dock",
                      tray_count: variantIds.length,
                    })
                  }
                >
                  Table view
                </Link>
              </Button>
              <Button
                variant="default"
                size="sm"
                className="h-11 min-h-11 flex-1 bg-[#14532d] hover:bg-[#14532d]/90 dark:bg-[#166534] sm:h-9 sm:min-h-9 sm:flex-initial"
                disabled={variantIds.length < 2}
                asChild
              >
                <Link
                  href={variantIds.length >= 2 ? comparePathForIds(variantIds) : "/compare"}
                  onClick={() =>
                    trackEvent("cta_click", {
                      event_category: GA_CATEGORIES.compare,
                      event_label: "open_compare_from_dock",
                      tray_count: variantIds.length,
                      link_href: variantIds.length >= 2 ? comparePathForIds(variantIds) : "/compare",
                    })
                  }
                >
                  {variantIds.length >= 2 ? "Compare now" : "Add one more"}
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
