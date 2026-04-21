"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Armchair,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Fuel,
  Gauge,
  GitCompare,
  Home,
  Layers,
  Loader2,
  MapPin,
  MinusCircle,
  MonitorSmartphone,
  Paintbrush,
  Play,
  Search,
  Shield,
  Sparkles,
  Sun,
  XCircle,
  Zap,
  MousePointerClick,
  Settings2,
  Palette,
  Star,
  CarFront,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RemoteImageWithFallback } from "@/components/ui/remote-image";
import { CarDetailAiAssistant } from "@/components/cars/car-detail-ai-assistant";
import { ExpertConsultationSection } from "@/components/shared/expert-consultation-section";
import { IndianDriveGuidePlayer } from "@/components/indian-drive-guide/indian-drive-guide-player";
import { exteriorFallbackForKey } from "@/lib/fallback-images";
import { cn, formatEngineDisplacementCc, formatINR } from "@/lib/utils";
import { IDG_FEATURE_COPY, IDG_HOME_VIDEOS, INDIAN_DRIVE_GUIDE_CHANNEL_URL } from "@/lib/indian-drive-guide-youtube";
import { getTaxonomy } from "@/lib/client/taxonomy-api";
import {
  buildTaxonomyLabelMaps,
  formatVariantSpecDisplay,
  labelForFeatureRowKey,
  labelForVariantFieldKey,
  orderedCompareAttributeKeys,
  specSortMeta,
  type TaxonomyLabelMaps,
} from "@/lib/taxonomy-labels";
import { CAR_DETAIL_NAV } from "@/components/cars/car-detail-nav-config";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveModelPricingInsights } from "@/components/cars/live-model-pricing-insights";
import { getTco } from "@/lib/client/prices-api";
import { matchPreferenceCity, TCO_CITIES } from "@/lib/tco-cities";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { DataAvailableSoonOverlay } from "@/components/ui/data-available-soon";
import { toast } from "sonner";
import { usePreferenceFinderStore } from "@/stores/preference-finder-store";
import { useCompareStore } from "@/stores/compare-store";
import type { Car } from "@/data/types";
import { SeoBreadcrumbs } from "@/components/seo/breadcrumbs";

type Field = { key: string; label: string; value: string };
type VariantFeatureMap = Record<string, Record<string, string>>;

export type LiveVariant = {
  id?: string;
  slug?: string;
  variant_name?: string;
  name?: string;
  fuel_type?: string;
  transmission?: string;
  ex_showroom_price?: number | string;
  /** Some catalogue payloads use this for sticker / ex-showroom. */
  purchase_price?: number | string;
  min_price?: number | string;
  max_price?: number | string;
  engine_cc?: number | string | null;
  power_hp?: number | string | null;
  torque_nm?: number | string | null;
  mileage_kmpl?: number | string | null;
  drive_type?: string | null;
  airbags?: number | string | null;
  features?: VariantFeatureMap;
  [key: string]: unknown;
};

type Props = {
  brand: string;
  /** Brand slug for catalogue links (e.g. /cars/brand/tata). */
  brandSlug?: string;
  model: string;
  /** Catalogue model slug (for EV subsidy query). */
  modelSlug?: string;
  bodyType: string;
  fuel: string;
  description: string;
  heroImage: string;
  startingPrice: number | null;
  maxPrice: number | null;
  detailFields: Field[];
  variants: LiveVariant[];
};

function toPrice(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;
  const s = String(value).replace(/,/g, "").replace(/\s/g, "").trim();
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function toReadable(value: unknown): string {
  if (value === null || value === undefined || value === "") return "N/A";
  if (typeof value === "number") return value.toLocaleString("en-IN");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map((v) => String(v)).join(", ");
  return String(value);
}

function humanizeCategory(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function humanizeKey(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

const VARIANT_SPEC_BLOCKLIST = new Set([
  "id",
  "model_id",
  "name",
  "variant_name",
  "slug",
  "features",
  "reviews",
  "created_at",
  "updated_at",
  "purchase_price",
]);

function featureStatus(value: string): "available" | "not_available" | "optional" {
  const v = value.trim().toLowerCase();
  if (!v || v === "n/a" || v === "na" || v === "no" || v === "not available") return "not_available";
  if (v.includes("optional") || v.includes("option")) return "optional";
  return "available";
}

/** Readable titles for API category keys (e.g. comfort and convenience). */
const FEATURE_CATEGORY_TITLE: Record<string, string> = {
  "comfort and convenience": "Comfort & convenience",
  "safety and security": "Safety & security",
  infotainment: "Infotainment",
  interior: "Interior",
  exterior: "Exterior",
};

function featureCategoryTitle(key: string): string {
  const k = key.toLowerCase().trim();
  return FEATURE_CATEGORY_TITLE[k] ?? humanizeCategory(k);
}

type FeatureCategoryVisual = {
  Icon: LucideIcon;
  /** Short label for compact chips */
  short: string;
  iconBg: string;
  iconFg: string;
  railActive: string;
};

const FEATURE_CATEGORY_VISUAL: Record<string, FeatureCategoryVisual> = {
  "comfort and convenience": {
    Icon: Armchair,
    short: "Comfort",
    iconBg: "bg-[#FFFBEB]",
    iconFg: "text-[#B45309]",
    railActive: "ring-[#FACC15]/50",
  },
  "safety and security": {
    Icon: Shield,
    short: "Safety",
    iconBg: "bg-[#EFF6FF]",
    iconFg: "text-[#1E40AF]",
    railActive: "ring-[#1E3A8A]/25",
  },
  infotainment: {
    Icon: MonitorSmartphone,
    short: "Infotainment",
    iconBg: "bg-[#F5F3FF]",
    iconFg: "text-[#6D28D9]",
    railActive: "ring-violet-300/80",
  },
  interior: {
    Icon: Home,
    short: "Interior",
    iconBg: "bg-[#FFF1F2]",
    iconFg: "text-[#BE123C]",
    railActive: "ring-rose-300/80",
  },
  exterior: {
    Icon: Sun,
    short: "Exterior",
    iconBg: "bg-[#FFF7ED]",
    iconFg: "text-[#C2410C]",
    railActive: "ring-[#F97316]/35",
  },
};

function getFeatureCategoryVisual(key: string): FeatureCategoryVisual {
  const k = key.toLowerCase().trim();
  return (
    FEATURE_CATEGORY_VISUAL[k] ?? {
      Icon: Paintbrush,
      short: featureCategoryTitle(key).split(/\s+/).slice(0, 2).join(" "),
      iconBg: "bg-[#F7F8FA]",
      iconFg: "text-[#374151]",
      railActive: "ring-[#E5E7EB]",
    }
  );
}

const DEFAULT_HERO_STAT_VISUAL = {
  wrap: "bg-slate-100 ring-1 ring-slate-200/60",
  icon: "text-slate-600",
  bar: "from-slate-400 via-slate-500 to-slate-600",
} as const;

const HERO_STAT_VISUAL: Record<string, { wrap: string; icon: string; bar: string }> = {
  engine_cc: {
    wrap: "bg-sky-500/15 ring-1 ring-sky-500/25",
    icon: "text-sky-700 dark:text-sky-500",
    bar: "from-sky-500 via-sky-400 to-cyan-500",
  },
  power_hp: {
    wrap: "bg-violet-500/15 ring-1 ring-violet-500/25",
    icon: "text-violet-700 dark:text-violet-500",
    bar: "from-violet-500 via-fuchsia-500 to-purple-600",
  },
  torque_nm: {
    wrap: "bg-fuchsia-500/15 ring-1 ring-fuchsia-500/25",
    icon: "text-fuchsia-700 dark:text-fuchsia-500",
    bar: "from-fuchsia-500 via-rose-400 to-orange-400",
  },
  mileage_kmpl: {
    wrap: "bg-emerald-500/15 ring-1 ring-emerald-500/25",
    icon: "text-emerald-700 dark:text-emerald-500",
    bar: "from-emerald-500 via-teal-400 to-cyan-500",
  },
};

/** Ex-showroom / list price from variant row (field names differ by API). */
function variantExShowroomPrice(v: LiveVariant): number | null {
  const r = v as Record<string, unknown>;
  return toPrice(v.ex_showroom_price ?? v.purchase_price ?? r.price ?? v.min_price);
}

function adaptAiCar(
  brand: string,
  model: string,
  bodyType: string,
  fuel: string,
  variant: LiveVariant,
  purchasePriceFromApi?: number | null
): Car {
  const price = (purchasePriceFromApi != null && purchasePriceFromApi > 0 ? purchasePriceFromApi : variantExShowroomPrice(variant)) ?? 0;
  const variantName = String(variant.variant_name ?? variant.name ?? "Variant");
  return {
    id: String(variant.id ?? `${brand}-${model}-${variantName}`),
    companyId: "catalogue",
    brand,
    model,
    variant: variantName,
    year: 2026,
    price,
    listPrice: price,
    discountPercent: 0,
    fuel: (fuel?.charAt(0).toUpperCase() + fuel?.slice(1).toLowerCase()) as Car["fuel"],
    transmission: String(variant.transmission ?? "Manual") as Car["transmission"],
    kms: 0,
    owners: 0,
    city: "India",
    sellerType: "Dealer",
    exteriorColor: "Default",
    images: [],
    engine: formatEngineDisplacementCc(variant.engine_cc),
    power: variant.power_hp ? `${variant.power_hp} hp` : "N/A",
    torque: variant.torque_nm ? `${variant.torque_nm} Nm` : "N/A",
    mileage: variant.mileage_kmpl ? `${variant.mileage_kmpl} kmpl` : "N/A",
    bodyType,
    features: [],
    specs: {},
    certified: false,
    isNew: true,
    trending: false,
    addedAt: new Date().toISOString(),
    reviews: [],
    estimatedEmiMonthly: 0,
    priceHistory: [],
    videoTitle: "",
    inspectionReport: [],
    ownershipTimeline: [],
    serviceTimeline: [],
    pros: [],
    cons: [],
    whyBuy: [],
    carbonScore: 0,
    matchProfileKey: "api-live",
  };
}

const SPECS_PREVIEW_COUNT = 12;

/** Offset anchor scroll for fixed header + sticky subnav. */
const ANCHOR_SCROLL_CLASS = "scroll-mt-32 sm:scroll-mt-36";

/** Readable type scale: eyebrow ≥12px, section titles ~20–24px, body 14–16px. */
const EYEBROW = "text-xs font-semibold uppercase tracking-[0.16em] text-[#1E3A8A]";
const EYEBROW_MUTED = "text-xs font-semibold uppercase tracking-wider text-[#6B7280]";
/** Section headings — ~18–20px, not oversized (prices use larger type separately). */
const SECTION_TITLE = "font-display text-lg font-bold tracking-tight text-[#111827] sm:text-xl";

/** Slightly stronger labels inside the hero price card (readable, not tiny). */
const HERO_CARD_EYEBROW =
  "text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-[#1E3A8A] sm:text-sm";

/** Short highlight bullets for variant cards (catalogue-backed). */
function variantQuickBullets(v: LiveVariant, fuelFallback: string): string[] {
  const out: string[] = [];
  if (v.power_hp != null && String(v.power_hp).trim()) out.push(`${v.power_hp} hp`);
  if (v.mileage_kmpl != null && String(v.mileage_kmpl).trim()) out.push(`${v.mileage_kmpl} km/l (claimed)`);
  if (v.airbags != null && String(v.airbags).trim()) out.push(`${v.airbags} airbag(s)`);
  if (v.engine_cc != null && String(v.engine_cc).trim()) out.push(formatEngineDisplacementCc(v.engine_cc));
  if (out.length < 3 && v.torque_nm) out.push(`${v.torque_nm} Nm torque`);
  if (out.length < 3) out.push(String(v.fuel_type ?? fuelFallback) + " · " + String(v.transmission ?? "—"));
  return Array.from(new Set(out)).slice(0, 5);
}

function specGroupHeading(key: string, maps: TaxonomyLabelMaps | null): string {
  const m = specSortMeta(key, maps);
  if (m.group === "zzz") return "Other";
  return m.group
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function LiveModelDetailView(props: Props) {
  const {
    brand,
    brandSlug,
    model,
    bodyType,
    fuel,
    description,
    heroImage,
    startingPrice,
    maxPrice,
    detailFields,
    variants,
  } = props;

  const { data: taxonomy } = useQuery({
    queryKey: ["taxonomy", "car"],
    queryFn: () => getTaxonomy({ category: "car" }),
    staleTime: 86_400_000,
  });

  const labelMaps = useMemo(
    () => (taxonomy ? buildTaxonomyLabelMaps(taxonomy.specs, taxonomy.features) : null),
    [taxonomy]
  );

  const preferenceCity = usePreferenceFinderStore((s) => s.promptSnapshot.city);
  const [tcoCity, setTcoCity] = useState("Mumbai");
  const debouncedTcoCity = useDebouncedValue(tcoCity, 400);
  /** UI city updated immediately; API keys use `debouncedTcoCity` — avoid showing stale prices while debouncing. */
  const priceKeyPending = tcoCity !== debouncedTcoCity;
  useEffect(() => {
    const m = matchPreferenceCity(preferenceCity);
    if (m) setTcoCity(m);
  }, [preferenceCity]);

  const [selectedSlug, setSelectedSlug] = useState<string>(String(variants[0]?.slug ?? variants[0]?.id ?? ""));
  const selectedVariant = useMemo(
    () =>
      variants.find((variant) => String(variant.slug ?? variant.id) === selectedSlug) ??
      variants[0] ??
      ({} as LiveVariant),
    [variants, selectedSlug]
  );

  const catalogueVariantId = String(selectedVariant.id ?? "").trim();

  /** When true, fetches TCO for every trim so prices show on all cards without clicking each one. */
  const [fetchAllTrimPrices, setFetchAllTrimPrices] = useState(false);

  /** Selected variant always loads; other trims load when user asks for all prices at once. */
  const variantTcoQueries = useQueries({
    queries: variants.map((v) => {
      const vid = String(v.id ?? "").trim();
      const isSelected = vid === catalogueVariantId;
      return {
        queryKey: ["prices-tco", vid, debouncedTcoCity] as const,
        queryFn: ({ signal }: { signal: AbortSignal }) => getTco(vid, debouncedTcoCity, { signal }),
        enabled: Boolean(vid && debouncedTcoCity) && (isSelected || fetchAllTrimPrices),
        staleTime: 5 * 60_000,
        gcTime: 30 * 60_000,
      };
    }),
  });

  const allTrimPricesPending =
    fetchAllTrimPrices &&
    variantTcoQueries.some((q, idx) => {
      const vid = String(variants[idx]?.id ?? "").trim();
      return Boolean(vid && debouncedTcoCity) && (q.isPending ?? false);
    });
  const allTrimPricesSettled =
    fetchAllTrimPrices &&
    !priceKeyPending &&
    variantTcoQueries.every((q, idx) => {
      const vid = String(variants[idx]?.id ?? "").trim();
      if (!vid || !debouncedTcoCity) return true;
      return !(q.isPending ?? false);
    });

  const selectedVariantIdx = useMemo(
    () => variants.findIndex((v) => String(v.slug ?? v.id) === selectedSlug),
    [variants, selectedSlug]
  );
  const selectedTcoResult = selectedVariantIdx >= 0 ? variantTcoQueries[selectedVariantIdx] : undefined;
  const selectedTcoData = selectedTcoResult?.data;
  /** Only treat as failed when not waiting on debounced city (avoid stale error state). */
  const selectedTcoApiFailed = !priceKeyPending && (selectedTcoResult?.isError ?? false);
  /** Never show purchase/TCO figures while city is debouncing or they belong to a stale key. */
  const selectedTco = priceKeyPending ? undefined : selectedTcoData;
  const purchasePriceFromTco =
    !priceKeyPending &&
    typeof selectedTco?.purchase_price === "number" &&
    selectedTco.purchase_price > 0
      ? selectedTco.purchase_price
      : null;
  const tcoPriceLoading =
    Boolean(catalogueVariantId) && (priceKeyPending || (selectedTcoResult?.isPending ?? false));
  const tcoTotalLabel =
    !priceKeyPending && typeof selectedTco?.total_cost === "number" ? formatINR(selectedTco.total_cost) : null;
  const tcoPerKmLabel =
    !priceKeyPending && typeof selectedTco?.cost_per_km === "number"
      ? `${formatINR(selectedTco.cost_per_km)} / km`
      : null;

  const addVariantToCompare = useCompareStore((s) => s.addVariant);
  const removeVariantFromCompare = useCompareStore((s) => s.removeVariant);
  const inCompareTray = useCompareStore((s) =>
    catalogueVariantId.length >= 8 ? s.hasVariant(catalogueVariantId) : false
  );
  /** Hide sticky price bar when compare tray has any variants (avoid stacking with compare dock). */
  const compareTrayCount = useCompareStore((s) => s.variantIds.length);
  const selectedPrice = variantExShowroomPrice(selectedVariant);
  const selectedMax = toPrice(selectedVariant.max_price);
  /** Sticky bar & fallbacks when variant row omits price but model range exists */
  const displayExShowroom =
    selectedPrice ?? toPrice(startingPrice) ?? toPrice(maxPrice) ?? null;

  const selectedVariantDisplayName = String(
    selectedVariant.variant_name ?? selectedVariant.name ?? ""
  ).trim();
  const featureBlocks = (selectedVariant.features ?? {}) as VariantFeatureMap;
  const featureOrder = ["comfort and convenience", "safety and security", "infotainment", "interior", "exterior"];
  const sortedFeatureCategories = [
    ...featureOrder.filter((category) => Object.prototype.hasOwnProperty.call(featureBlocks, category)),
    ...Object.keys(featureBlocks).filter((category) => !featureOrder.includes(category)),
  ];
  const [selectedFeatureCategory, setSelectedFeatureCategory] = useState<string>(sortedFeatureCategories[0] ?? "");
  const [featureQuery, setFeatureQuery] = useState("");
  const [diffOnly, setDiffOnly] = useState(false);
  useEffect(() => {
    // Reset category/search toggles only when variant changes.
    setSelectedFeatureCategory(sortedFeatureCategories[0] ?? "");
    setFeatureQuery("");
    setDiffOnly(false);
  }, [selectedSlug]);
  const activeFeatureCategory = sortedFeatureCategories.includes(selectedFeatureCategory)
    ? selectedFeatureCategory
    : (sortedFeatureCategories[0] ?? "");
  const activeFeatureEntries = (featureBlocks[activeFeatureCategory] ?? {}) as Record<string, string>;
  const featureRows = Object.entries(activeFeatureEntries).filter(([name, value]) => {
    const displayName = labelMaps ? labelForFeatureRowKey(name, labelMaps) : name;
    if (
      featureQuery &&
      !`${name} ${displayName} ${value}`.toLowerCase().includes(featureQuery.toLowerCase())
    ) {
      return false;
    }
    if (!diffOnly) return true;
    const values = variants.map((variant) => String((variant.features?.[activeFeatureCategory] ?? {})[name] ?? "").trim());
    return new Set(values).size > 1;
  });
  // Keep the hero image anchored to model-level primary photo; variant imagery remains in gallery cards.
  const selectedVariantImage = String(
    heroImage || selectedVariant.hero_image_url || selectedVariant.image_url || selectedVariant.thumbnail_url || ""
  );
  const navItems = CAR_DETAIL_NAV;
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [specsExpanded, setSpecsExpanded] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const selectedVariantFields = useMemo(() => {
    const entries = Object.entries(selectedVariant).filter(([key, value]) => {
      if (VARIANT_SPEC_BLOCKLIST.has(key)) return false;
          if (value === null || value === undefined || value === "") return false;
          if (typeof value === "object") return false;
          return true;
    });
    const keys = orderedCompareAttributeKeys(
      new Set(entries.map(([k]) => k)),
      new Set(),
      labelMaps
    );
    const byKey = new Map(entries);
    return keys.map((key) => {
      const value = byKey.get(key);
      return {
          key,
          label: labelMaps ? labelForVariantFieldKey(key, labelMaps) : humanizeKey(key),
        value: formatVariantSpecDisplay(key, value, labelMaps),
      };
    });
  }, [selectedVariant, labelMaps]);

  const hasCatalogueGalleryUrls = useMemo(
    () => variants.some((v) => Boolean(String(v.hero_image_url ?? v.image_url ?? v.thumbnail_url ?? "").trim())),
    [variants]
  );

  const variantCore = useMemo(() => {
    const specLabel = (canonicalKey: string, fallback: string) =>
      labelMaps?.specByKey.get(canonicalKey)?.display_name ?? fallback;
    return [
      {
        key: "engine_cc",
        label: specLabel("engine_cc", "Engine displacement"),
        value: formatEngineDisplacementCc(selectedVariant.engine_cc),
      },
      {
        key: "power_hp",
        label: specLabel("power_hp", "Power"),
        value: selectedVariant.power_hp ? `${selectedVariant.power_hp} hp` : "N/A",
      },
      {
        key: "torque_nm",
        label: specLabel("torque_nm", "Torque"),
        value: selectedVariant.torque_nm ? `${selectedVariant.torque_nm} Nm` : "N/A",
      },
      {
        key: "mileage_kmpl",
        label: specLabel("mileage_kmpl", "Mileage"),
        value: selectedVariant.mileage_kmpl ? `${selectedVariant.mileage_kmpl} kmpl` : "N/A",
      },
      {
        key: "transmission",
        label: "Transmission",
        value: String(selectedVariant.transmission ?? "N/A"),
      },
      {
        key: "fuel_type",
        label: "Fuel",
        value: String(selectedVariant.fuel_type ?? fuel ?? "N/A"),
      },
      {
        key: "airbags",
        label: specLabel("airbags", "Airbags"),
        value: toReadable(selectedVariant.airbags),
      },
      {
        key: "drive_type",
        label: specLabel("drive_type", "Drivetrain"),
        value: toReadable(selectedVariant.drive_type),
      },
    ];
  }, [selectedVariant, fuel, labelMaps]);
  const keyHighlights = [
    `Transmission: ${String(selectedVariant.transmission ?? "—")}`,
    `Fuel type: ${String(selectedVariant.fuel_type ?? fuel ?? "—")}`,
    selectedVariant.mileage_kmpl
      ? `Mileage: ${selectedVariant.mileage_kmpl} km/l (claimed)`
      : "Mileage: from catalogue",
    selectedVariant.range_km
      ? `Electric range: ${selectedVariant.range_km} km`
      : "Range: from catalogue where listed",
  ];

  const heroQuickStats = useMemo(() => variantCore.slice(0, 4), [variantCore]);

  const statIcon = (key: string) => {
    switch (key) {
      case "engine_cc":
        return Gauge;
      case "power_hp":
        return Zap;
      case "torque_nm":
        return Activity;
      case "mileage_kmpl":
        return Fuel;
      default:
        return Layers;
    }
  };

  const breadcrumbItems = useMemo(() => {
    const items: { name: string; href?: string }[] = [
      { name: "Home", href: "/" },
      { name: "Cars", href: "/cars" },
    ];
    if (brandSlug) items.push({ name: brand, href: `/cars/brand/${encodeURIComponent(brandSlug)}` });
    else items.push({ name: brand });
    items.push({ name: model });
    return items;
  }, [brand, brandSlug, model]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: [0.2, 0.45, 0.7] }
    );
    navItems.forEach((item) => {
      const el = sectionRefs.current[item.id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [selectedSlug, navItems]);

  useEffect(() => {
    setSpecsExpanded(false);
  }, [selectedSlug]);

  const [showStickyPriceStrip, setShowStickyPriceStrip] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowStickyPriceStrip(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const visibleVariantFields =
    specsExpanded || selectedVariantFields.length <= SPECS_PREVIEW_COUNT
      ? selectedVariantFields
      : selectedVariantFields.slice(0, SPECS_PREVIEW_COUNT);

  const showStickyPriceBar =
    showStickyPriceStrip && Boolean(catalogueVariantId) && compareTrayCount === 0;

  return (
    <div className={cn("relative min-w-0 bg-[#F7F8FA] pb-20 text-[#111827]", showStickyPriceBar && "pb-28")}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(420px,45vh)] bg-[radial-gradient(ellipse_80%_55%_at_100%_0%,rgba(30,58,138,0.06),transparent_58%),radial-gradient(ellipse_55%_40%_at_0%_100%,rgba(249,115,22,0.04),transparent_52%)]"
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-[min(100%,92rem)] px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <SeoBreadcrumbs items={breadcrumbItems} />
        </div>

      <section
        ref={(el) => {
          sectionRefs.current.overview = el;
        }}
        id="overview"
          className="scroll-mt-24 pb-0"
        >
          <div className="mt-4 grid min-w-0 grid-cols-1 gap-5 sm:mt-5 sm:gap-6 lg:grid-cols-12 lg:items-stretch lg:gap-6 xl:gap-8">
            <div className="flex min-w-0 flex-col gap-4 sm:gap-5 lg:col-span-7 lg:h-full lg:min-h-0 xl:col-span-7">
              <div className="group relative min-w-0 shrink-0 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_12px_40px_-24px_rgba(15,23,42,0.15)] ring-1 ring-black/[0.03]">
                <div className="relative aspect-[16/10] w-full sm:aspect-[16/9]">
            <RemoteImageWithFallback
              src={selectedVariantImage || exteriorFallbackForKey(`${brand}-${model}`)}
              alt={`${brand} ${model}`}
              fill
                    className="object-cover transition duration-500 group-hover:scale-[1.015] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    sizes="(max-width:1024px) 100vw, 50vw"
              priority
            />
          </div>
                <div className="border-t border-[#E5E7EB] bg-white px-4 py-4 sm:px-5 sm:py-4">
                  <p className={EYEBROW_MUTED}>Selected trim</p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-[#111827] sm:text-base">
                    {String(selectedVariant.variant_name ?? selectedVariant.name ?? "Choose a variant below")}
                  </p>
                </div>
                <div className="border-t border-[#E5E7EB] bg-linear-to-b from-[#F8FAFC] via-white to-[#FAFBFC] px-4 py-4 sm:px-5 sm:py-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className={EYEBROW}>Specs preview</p>
                      <p className="mt-1 text-[0.6875rem] leading-snug text-[#64748B] sm:text-xs">
                        Key numbers for this trim
                      </p>
                    </div>
                    <a
                      href="#specs"
                      className="shrink-0 rounded-lg bg-white/80 px-2.5 py-1.5 text-xs font-semibold text-[#C2410C] shadow-sm ring-1 ring-[#E5E7EB] transition hover:bg-[#FFF7ED] hover:ring-[#F97316]/35 sm:text-sm"
                    >
                      View all
                    </a>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                    {heroQuickStats.map((item) => {
                      const Icon = statIcon(item.key);
                      const vis = { ...DEFAULT_HERO_STAT_VISUAL, ...HERO_STAT_VISUAL[item.key] };
                      return (
                        <div
                          key={item.key}
                          className={cn(
                            "group relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-[#E2E8F0]/90 bg-white p-2.5 shadow-[0_6px_20px_-10px_rgba(15,23,42,0.12)] ring-1 ring-[#F1F5F9]",
                            "transition-[transform,box-shadow,border-color] duration-200",
                            "hover:-translate-y-0.5 hover:border-[#1E3A8A]/20 hover:shadow-[0_12px_28px_-12px_rgba(30,58,138,0.18)]",
                            "motion-reduce:transform-none motion-reduce:hover:translate-y-0"
                          )}
                        >
                          <div
                            className={cn(
                              "pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-linear-to-r opacity-95",
                              vis.bar
                            )}
                            aria-hidden
                          />
                          <div className="flex shrink-0 items-start justify-between gap-2 pt-0.5">
                            <span
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]",
                                vis.wrap
                              )}
                            >
                              <Icon className={cn("h-4 w-4", vis.icon)} aria-hidden />
                            </span>
                          </div>
                          <p
                            className="mt-1.5 line-clamp-2 text-[0.625rem] font-semibold uppercase leading-tight tracking-[0.06em] text-[#64748B] sm:text-[0.6875rem] sm:tracking-[0.05em]"
                            title={item.label}
                          >
                            {item.label}
                          </p>
                          <p className="mt-1 font-display text-[0.875rem] font-bold tabular-nums leading-none tracking-tight text-[#0F172A] sm:text-[0.9375rem]">
                            {item.value}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="relative flex min-h-[260px] flex-1 flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm lg:min-h-0">
                <div className="pointer-events-none space-y-6 p-5 opacity-[0.65] blur-[2.5px] sm:p-7 sm:pb-8">
            <div>
                    <p className={EYEBROW}>Gallery</p>
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {variants.slice(0, 6).map((v, i) => {
                        const src = String(v.hero_image_url ?? v.image_url ?? v.thumbnail_url ?? heroImage);
                        return (
                          <div
                            key={String(v.slug ?? v.id ?? i)}
                            className="relative h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#F3F4F6]"
                          >
                            <RemoteImageWithFallback
                              src={src || exteriorFallbackForKey(`${brand}-${model}`)}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="72px"
                            />
            </div>
                        );
                      })}
            </div>
                  </div>
                  <div>
                    <p className={EYEBROW}>Colours</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {[
                        "from-slate-700 to-slate-900",
                        "from-zinc-400 to-zinc-600",
                        "from-red-700 to-red-900",
                        "from-blue-800 to-blue-950",
                        "from-emerald-700 to-emerald-900",
                        "from-amber-400 to-amber-600",
                      ].map((g, i) => (
                        <span
                          key={g}
                          className={cn(
                            "h-11 w-11 rounded-full bg-linear-to-br shadow-inner ring-2 ring-offset-2",
                            g,
                            i === 0 ? "ring-[#1E3A8A] ring-offset-white" : "ring-transparent ring-offset-white"
                          )}
                          aria-hidden
                        />
                      ))}
            </div>
                  </div>
                </div>
                <DataAvailableSoonOverlay
                  variant="soft"
                  minHeight="min-h-[260px]"
                  sectionLabel="Gallery & colours"
                />
              </div>
            </div>

            <div className="flex min-w-0 w-full flex-col gap-3 sm:gap-4 lg:col-span-5 lg:h-full lg:min-h-0 lg:gap-3 xl:col-span-5">
              <div className="relative w-full shrink-0 overflow-x-clip overflow-y-visible rounded-[1.25rem] border border-[#E5E7EB] bg-white shadow-[0_20px_56px_-36px_rgba(15,23,42,0.22)] ring-1 ring-black/[0.03]">
                <div
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_100%_-15%,rgba(30,58,138,0.07),transparent_52%),radial-gradient(ellipse_55%_45%_at_0%_105%,rgba(249,115,22,0.06),transparent_58%)]"
                  aria-hidden
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-linear-to-r from-[#1E3A8A] via-[#2563EB] to-[#F97316]" aria-hidden />

                {/* Meta: catalogue, live quote, city (pricing scope on the right) */}
                <div className="relative border-b border-[#E5E7EB] bg-[#FAFBFC]/95 px-3 py-3 sm:px-4 sm:py-3.5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-4">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#6B7280] shadow-sm sm:text-xs">
                        <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#FACC15] sm:h-4 sm:w-4" aria-hidden />
                        Catalogue · {brand}
                      </span>
                      <span className="rounded-full bg-[#1E3A8A] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm sm:text-xs">
                        Live quote
                      </span>
                      <div className="flex h-8 min-w-0 items-center gap-1.5 rounded-xl border-2 border-[#BFDBFE]/90 bg-linear-to-br from-white via-[#EFF6FF] to-[#DBEAFE]/40 py-0 pl-2 pr-1 shadow-[0_4px_16px_-8px_rgba(30,58,138,0.35)] ring-1 ring-[#1E3A8A]/[0.08] sm:gap-2 sm:pl-2.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-[#1E3A8A] sm:h-4 sm:w-4" aria-hidden />
                        <span className="hidden shrink-0 text-[10px] font-bold uppercase tracking-wide text-[#1E3A8A]/80 sm:inline">
                          City
                        </span>
                        <Select value={tcoCity} onValueChange={setTcoCity}>
                          <SelectTrigger
                            id="hero-city-meta-select"
                            aria-label="City for pricing"
                            title="Change city for on-road and TCO"
                            className="h-8 min-h-8 max-w-[9.5rem] min-w-0 flex-1 rounded-lg border-0 bg-white/70 px-1.5 py-0 text-left text-sm font-semibold leading-none text-[#0f172a] shadow-none backdrop-blur-sm transition-colors hover:bg-white focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-[#3B82F6]/40 focus-visible:ring-offset-0 data-[state=open]:bg-white sm:max-w-[11rem] sm:px-2"
                          >
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
                    </div>
                    <p className="text-xs font-medium leading-snug text-[#4B5563] sm:max-w-[20rem] sm:text-right sm:text-[0.8125rem] md:whitespace-nowrap">
                      On-road &amp; 5-year totals for{" "}
                      <span className="font-semibold text-[#111827]">{tcoCity}</span>
                    </p>
                  </div>
                </div>

                {/* Title + trim + quick tags */}
                <div className="relative border-b border-[#E5E7EB] bg-white px-3 py-4 sm:px-5 sm:py-5 lg:px-6">
                  <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-[#111827] sm:text-3xl">
                    {brand} {model}
                  </h1>
                  <p className="mt-2 text-sm font-medium text-[#374151] sm:text-base">
                    {String(selectedVariant.variant_name ?? selectedVariant.name ?? "Select a variant for full specs")}
                  </p>
                  <div className="mt-4 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-x-2.5 sm:gap-y-2.5 [&::-webkit-scrollbar]:hidden">
                    <Badge variant="outline" className="shrink-0 rounded-lg border-[#E5E7EB] bg-[#FAFBFC] px-3 py-1 text-sm font-medium capitalize text-[#111827]">
                      {bodyType}
                    </Badge>
                    <Badge variant="outline" className="shrink-0 rounded-lg border-[#E5E7EB] bg-[#FAFBFC] px-3 py-1 text-sm font-medium capitalize text-[#111827]">
                      {String(selectedVariant.fuel_type ?? fuel)}
                    </Badge>
                    {purchasePriceFromTco ? (
                      <Badge className="shrink-0 rounded-lg border border-[#F97316]/30 bg-[#FFF7ED] px-3 py-1 text-sm font-semibold text-[#C2410C]">
                        {formatINR(purchasePriceFromTco)} · {tcoCity}
                      </Badge>
                    ) : null}
                    {selectedMax && purchasePriceFromTco && selectedMax > purchasePriceFromTco ? (
                      <Badge variant="secondary" className="shrink-0 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1 text-sm font-medium text-[#6B7280]">
                        Up to {formatINR(selectedMax)}
                      </Badge>
                    ) : null}
                    {variants.length === 0 ? (
                      <span className="shrink-0 text-xs text-[#6B7280] sm:text-sm">No variants listed.</span>
                    ) : null}
                  </div>
                </div>

                <div className="relative bg-linear-to-b from-white to-[#FAFBFC]/90">
                  <div className="px-3 pb-5 pt-1 sm:px-5 sm:pb-6 lg:px-7 lg:pb-7 xl:px-8">
                    <div
                      className={cn(
                        "rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_8px_28px_-16px_rgba(15,23,42,0.08)]",
                        (tcoTotalLabel || tcoPerKmLabel) &&
                          !tcoPriceLoading &&
                          purchasePriceFromTco &&
                          !selectedTcoApiFailed &&
                          "lg:grid lg:grid-cols-2 lg:divide-x lg:divide-[#E5E7EB] lg:rounded-2xl lg:p-0"
                      )}
                    >
                      <section
                        aria-labelledby="hero-purchase-heading"
                        className={cn(
                          "min-w-0 space-y-2.5 p-4 sm:p-5 lg:p-6",
                          (tcoTotalLabel || tcoPerKmLabel) &&
                            !tcoPriceLoading &&
                            purchasePriceFromTco &&
                            !selectedTcoApiFailed &&
                            "bg-linear-to-br from-[#FFFBF7] via-white to-white lg:rounded-none lg:rounded-l-2xl lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:justify-start lg:self-stretch"
                        )}
                      >
                        <div className="space-y-0.5">
                          <h3
                            id="hero-purchase-heading"
                            className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[#1E3A8A] sm:text-[0.8125rem]"
                          >
                            Purchase price
                          </h3>
                          <p className="text-xs text-[#4B5563] sm:text-[0.8125rem]">On-road for this trim</p>
                        </div>
                        {tcoPriceLoading ? (
                          <div className="space-y-2 pt-0.5">
                            <Skeleton className="h-14 w-56 max-w-full rounded-xl" />
                            <Skeleton className="h-4 w-64 max-w-full rounded-md" />
                          </div>
                        ) : selectedTcoApiFailed || !purchasePriceFromTco ? (
                          <div className="relative mt-0 min-h-[88px] rounded-xl bg-[#F7F8FA]/90">
                            <DataAvailableSoonOverlay minHeight="min-h-[88px]" sectionLabel="Purchase price" compact />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="font-display text-2xl font-bold leading-none tabular-nums tracking-tight text-[#C2410C] whitespace-nowrap sm:text-3xl lg:text-[1.75rem] xl:text-3xl">
                              {formatINR(purchasePriceFromTco)}
                            </p>
                            {selectedMax && selectedMax > purchasePriceFromTco ? (
                              <p className="text-xs text-[#4B5563] sm:text-sm">Top trim: up to {formatINR(selectedMax)}</p>
                            ) : null}
                          </div>
                        )}
                        {variants.length > 0 ? (
                          <div className="mt-4 border-t border-[#E5E7EB]/90 pt-4">
                            <p
                              id="hero-variant-label"
                              className="text-[0.6875rem] font-semibold uppercase leading-none tracking-[0.14em] text-[#6B7280]"
                            >
                              Catalogue trim
                            </p>
                            <label className="sr-only" htmlFor="hero-variant-select">
                              Select catalogue trim. Updates price and specifications.
                            </label>
                            <Select value={selectedSlug} onValueChange={setSelectedSlug}>
                              <SelectTrigger
                                id="hero-variant-select"
                                aria-labelledby="hero-variant-label"
                                title="Switch to another trim"
                                className={cn(
                                  "mt-2 h-8 min-h-8 w-full min-w-0 max-w-[20rem] rounded-lg border-2 border-[#1E3A8A]/35 bg-linear-to-b from-[#EEF2FF] to-white px-2.5 text-left text-sm font-semibold leading-none text-[#0f172a]",
                                  "shadow-[0_4px_14px_-8px_rgba(30,58,138,0.35)] ring-1 ring-[#1E3A8A]/12 transition-[box-shadow,border-color]",
                                  "hover:border-[#1E3A8A]/45 hover:bg-white hover:shadow-md",
                                  "focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/30",
                                  "data-[state=open]:border-[#1E3A8A]/50 data-[state=open]:shadow-md data-[state=open]:ring-0 sm:px-3"
                                )}
                              >
                                <SelectValue placeholder="Choose trim" />
                              </SelectTrigger>
                              <SelectContent>
                                {variants.map((variant, idx) => (
                                  <SelectItem
                                    key={String(variant.id ?? variant.slug ?? idx)}
                                    value={String(variant.slug ?? variant.id ?? idx)}
                                  >
                                    {String(variant.variant_name ?? variant.name ?? `Variant ${idx + 1}`)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : null}
                      </section>

                      {(tcoTotalLabel || tcoPerKmLabel) && !tcoPriceLoading && purchasePriceFromTco && !selectedTcoApiFailed ? (
                        <section
                          aria-labelledby="hero-ownership-heading"
                          className="min-w-0 border-t border-[#E5E7EB] p-4 sm:p-5 lg:border-t-0 lg:rounded-none lg:rounded-r-2xl lg:bg-[#FAFBFC]/40 lg:p-6"
                        >
                          <div className="space-y-1">
                            <h3 id="hero-ownership-heading" className={HERO_CARD_EYEBROW}>
                              Ownership snapshot
                            </h3>
                            <p className="text-sm text-[#4B5563]">
                              5-year view · <span className="font-medium text-[#111827]">{tcoCity}</span>
                            </p>
                          </div>
                          <div className="mt-3 overflow-hidden rounded-xl border border-[#E5E7EB]/90 bg-white shadow-sm">
                            <div className="divide-y divide-[#E5E7EB]">
                              {tcoTotalLabel ? (
                                <div className="flex min-w-0 flex-col gap-1 bg-[#F8FAFC] px-3 py-2 sm:px-4 sm:py-2.5">
                                  <span className="min-w-0 text-[0.8125rem] font-medium leading-snug text-[#374151] sm:text-sm">
                                    5-year total cost
                                  </span>
                                  <span className="font-display text-base font-bold tabular-nums leading-none text-[#111827] sm:text-lg">
                                    {tcoTotalLabel}
                                  </span>
                                </div>
                              ) : null}
                              {tcoPerKmLabel ? (
                                <div className="flex min-w-0 items-center justify-between gap-3 bg-white px-3 py-2 sm:px-4 sm:py-2.5">
                                  <span className="min-w-0 shrink text-[0.8125rem] font-medium leading-snug text-[#374151] sm:text-sm">
                                    Cost per km
                                  </span>
                                  <span className="shrink-0 text-right font-display text-sm font-bold tabular-nums leading-none text-[#111827] sm:text-base">
                                    {tcoPerKmLabel}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </section>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-linear-to-b from-white via-[#FAFBFC] to-white shadow-[0_12px_40px_-28px_rgba(15,23,42,0.14)] ring-1 ring-black/[0.04]">
                <div className="border-b border-[#E5E7EB]/90 bg-[#FAFBFC]/80 px-3 py-3.5 sm:px-4 sm:py-4">
                  <p className={EYEBROW_MUTED}>About this model</p>
                  <p className="mt-2 line-clamp-4 text-pretty text-sm leading-relaxed text-[#4B5563] sm:text-base">
                    {description}
                  </p>
                </div>

                <div className="border-b border-[#E5E7EB]/80 bg-linear-to-b from-white to-[#FAFBFC]/90 px-3 py-3 sm:px-4 sm:py-3.5">
                  <p className={cn(EYEBROW_MUTED, "text-[0.6875rem] tracking-wide sm:text-xs")}>Quick actions</p>
                  <div className="mt-2.5 flex flex-col gap-1.5 sm:mt-3 sm:flex-row sm:flex-wrap sm:gap-2">
                    <Button
                      className="min-h-10 w-full shrink-0 rounded-lg gap-1.5 bg-[#F97316] px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#ea580c] sm:min-h-11 sm:w-auto sm:min-w-40 sm:flex-1 sm:px-3.5 lg:min-w-0 lg:flex-1"
                      asChild
                    >
                      <a href="#pricing">On-road price &amp; EMI</a>
                    </Button>
                <Button
                  type="button"
                      variant={inCompareTray ? "secondary" : "outline"}
                  className={cn(
                        "min-h-10 w-full min-w-0 shrink-0 justify-center rounded-lg gap-1.5 px-2.5 text-sm font-semibold border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] sm:min-h-11 sm:w-auto sm:min-w-0 sm:flex-1 sm:px-3.5 lg:min-w-0 lg:flex-1",
                        inCompareTray && "border-transparent bg-secondary"
                  )}
                      title={inCompareTray ? "Remove from compare" : undefined}
                      aria-label={inCompareTray ? "Remove from compare" : "Add to compare"}
                  onClick={() => {
                        if (catalogueVariantId.length < 8) {
                          toast.message("This trim isn't on compare yet — try another variant or check back soon.");
                          return;
                        }
                    if (inCompareTray) {
                      removeVariantFromCompare(catalogueVariantId);
                      return;
                    }
                    const ok = addVariantToCompare(catalogueVariantId);
                    if (!ok) toast.message("Compare is full (max 3). Remove a variant to add another.");
                  }}
                >
                      <GitCompare className="h-3.5 w-3.5 shrink-0" />
                      <span className="min-w-0 truncate">{inCompareTray ? "Remove" : "Compare"}</span>
                </Button>
                    <Button
                      className="min-h-10 w-full shrink-0 rounded-lg gap-1.5 bg-[#1E3A8A] px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1e40af] sm:min-h-11 sm:w-auto sm:px-3.5 sm:flex-1 lg:min-w-0 lg:flex-1"
                      asChild
                    >
                      <Link href="/book-expert">Talk to an expert</Link>
              </Button>
            </div>
                </div>

                <div className="bg-white px-3 py-3 sm:px-4 sm:py-3.5">
                  <p className={EYEBROW_MUTED}>At a glance</p>
                  <ul className="mt-2 grid gap-1.5 sm:grid-cols-2 sm:gap-x-3 sm:gap-y-1.5">
                    {keyHighlights.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 rounded-lg border border-[#E5E7EB]/70 bg-[#FAFBFC] px-2.5 py-1.5 text-sm leading-snug text-[#111827] sm:gap-2.5 sm:px-3 sm:py-2"
                      >
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FACC15]/35">
                          <CheckCircle2 className="h-3 w-3 text-[#A16207]" aria-hidden />
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
      </section>
      </div>

      <div className="sticky top-14 z-40 mt-6 border-b border-[#E5E7EB] bg-[#F7F8FA]/95 pb-0 pt-1 backdrop-blur-md supports-[backdrop-filter]:bg-[#F7F8FA]/90 sm:top-16">
      <nav
        className={cn(
          "rounded-t-xl border border-b-0 border-[#E5E7EB] bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.06)] supports-[backdrop-filter]:bg-white/92"
        )}
        aria-label="Section navigation"
      >
        <div className="mx-auto max-w-[min(100%,92rem)] px-3 py-3 sm:px-5 sm:py-3 lg:px-8">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-2.5">
            {navItems.map((item) => {
              const active = activeSection === item.id;
              return (
              <a
                key={item.id}
                href={`#${item.id}`}
                  className={cn(
                    "inline-flex min-h-10 items-center justify-center rounded-full px-3 py-2 text-xs font-semibold tracking-tight transition-all sm:min-h-11 sm:px-4 sm:text-sm",
                    active
                      ? "bg-[#1E3A8A] text-white shadow-sm shadow-[#1E3A8A]/20"
                      : "bg-[#F7F8FA] text-[#6B7280] hover:bg-[#EEF2FF] hover:text-[#1E3A8A]"
                  )}
              >
                {item.label}
              </a>
              );
            })}
          </div>
        </div>
      </nav>
      </div>

      <section
        ref={(el) => {
          sectionRefs.current.pricing = el;
        }}
        id="pricing"
        className={cn("mx-auto max-w-[min(100%,92rem)] px-4 py-6 sm:px-6 lg:px-8", ANCHOR_SCROLL_CLASS)}
      >
        <header className="mb-8 max-w-3xl">
          <p className={EYEBROW}>Price</p>
          <h2 className={cn(SECTION_TITLE, "mt-2")}>Pricing &amp; ownership</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#4B5563] sm:text-base">
            Figures use Autolokate pricing for <span className="font-semibold text-[#111827]">{tcoCity}</span>. Change city in the hero to update all sections.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="relative overflow-hidden rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
            <CardContent className="relative p-5 sm:p-6">
              <p className={EYEBROW_MUTED}>Live snapshot</p>
              <div
                className={cn(
                  "mt-3 space-y-3 text-sm sm:text-base",
                  (tcoPriceLoading || selectedTcoApiFailed || !purchasePriceFromTco) && "pointer-events-none min-h-[100px]"
                )}
              >
                {tcoPriceLoading ? (
                  <div className="space-y-2 pt-1">
                    <Skeleton className="h-8 w-full rounded-lg" />
                    <Skeleton className="h-8 w-full rounded-lg" />
                  </div>
                ) : selectedTcoApiFailed || !purchasePriceFromTco ? (
                  <div className="relative min-h-[100px] rounded-xl">
                    <DataAvailableSoonOverlay minHeight="min-h-[100px]" sectionLabel="Price details" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3">
                      <span className="text-[#4B5563]">Purchase (this trim)</span>
                      <span className="text-right text-xl font-bold tabular-nums text-[#F97316] wrap-anywhere sm:text-2xl">
                        {formatINR(purchasePriceFromTco)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 pt-1">
                      <span className="text-[#4B5563]">5-year total cost</span>
                      <span className="text-xl font-bold tabular-nums text-[#111827] sm:text-2xl">{tcoTotalLabel ?? "—"}</span>
                    </div>
                  </>
                )}
              </div>
          </CardContent>
        </Card>
          <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm ring-1 ring-[#FACC15]/25">
            <CardContent className="p-5 sm:p-6">
              <p className={EYEBROW_MUTED}>On-road &amp; taxes</p>
              <p className="mt-3 text-sm leading-relaxed text-[#4B5563] sm:text-base">
                RTO, insurance, and local fees are extra. Ask our team for an on-road number for your city.
              </p>
              <Button className="mt-4 min-h-11 w-full rounded-xl bg-[#1E3A8A] px-4 text-sm font-semibold text-white hover:bg-[#1e40af] sm:min-h-12 sm:px-5 sm:text-base sm:w-auto" asChild>
                <Link href="/book-expert">Get on-road estimate</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <LiveModelPricingInsights
            variantId={selectedVariant.id ? String(selectedVariant.id) : undefined}
            fuelTypeLabel={String(selectedVariant.fuel_type ?? fuel)}
            preferenceCity={preferenceCity}
            fuelTypeFilter={String(selectedVariant.fuel_type ?? "").toLowerCase()}
            tcoCity={tcoCity}
            tcoCityForApi={debouncedTcoCity}
            onTcoCityChange={setTcoCity}
          />
        </div>
      </section>

      <section
        ref={(el) => {
          sectionRefs.current.variants = el;
        }}
        id="variants"
        className={cn("mx-auto max-w-[min(100%,92rem)] px-4 pt-5 sm:px-6 sm:pt-6 lg:px-8", ANCHOR_SCROLL_CLASS)}
      >
        <div className="relative overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_12px_40px_-28px_rgba(15,23,42,0.12)]">
          <div className="relative border-b border-[#E5E7EB] bg-[#F7F8FA] px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#1E3A8A]/20 bg-[#1E3A8A]/10 text-[#1E3A8A] sm:h-12 sm:w-12">
                  <Layers className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className={EYEBROW}>Line-up</p>
                  <h2 className={cn(SECTION_TITLE, "mt-2")}>Variants &amp; prices</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#4B5563] sm:text-base">
                    Prices for <span className="font-semibold text-[#111827]">{tcoCity}</span>. Tap a trim to update the page, or load all
                    trim prices at once.
                  </p>
                  <p className="mt-3 inline-flex items-center gap-2 text-sm text-[#4B5563]">
                    <MousePointerClick className="h-4 w-4 shrink-0 text-[#F97316]" aria-hidden />
                    <span className="font-medium text-[#111827]">Tap a card</span> to select
                  </p>
                </div>
              </div>
              {variants.length > 0 ? (
                <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:items-end">
                  <Badge className="h-fit w-fit rounded-full border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-semibold text-[#111827]">
                    {variants.length} trim{variants.length === 1 ? "" : "s"}
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-12 w-full justify-center gap-2 rounded-xl border-[#1E3A8A]/25 bg-white px-4 text-base font-semibold text-[#1E3A8A] shadow-sm hover:bg-[#EEF2FF] sm:w-auto sm:min-w-[14rem]"
                    disabled={fetchAllTrimPrices && Boolean(allTrimPricesSettled)}
                    onClick={() => setFetchAllTrimPrices(true)}
                  >
                    {allTrimPricesPending ? (
                      <>
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                        Loading all prices…
                      </>
                    ) : fetchAllTrimPrices && allTrimPricesSettled ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                        All trim prices loaded
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 shrink-0 text-[#F97316]" aria-hidden />
                        Get prices for all trims
                      </>
                    )}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="p-3 sm:p-5 lg:p-6">
            {variants.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#E5E7EB] bg-[#F7F8FA] px-4 py-10 text-center text-base text-[#4B5563]">
                No variants for this model right now. Try again later or browse similar cars.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {variants.map((variant, idx) => {
                const id = String(variant.slug ?? variant.id ?? idx);
                const isActive = String(selectedVariant.slug ?? selectedVariant.id ?? "") === id;
                  const tcoQ = variantTcoQueries[idx];
                  const apiPurchase =
                    typeof tcoQ?.data?.purchase_price === "number" && tcoQ.data.purchase_price > 0
                      ? tcoQ.data.purchase_price
                      : null;
                  const cardPriceLoading =
                    Boolean(String(variant.id ?? "").trim()) &&
                    ((priceKeyPending && isActive) || (tcoQ?.isPending ?? false));
                  const cardPriceError = !priceKeyPending && (tcoQ?.isError ?? false);
                  const showPriceLocked = !cardPriceLoading && !apiPurchase;
                  const bullets = variantQuickBullets(variant, fuel);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedSlug(id)}
                    className={cn(
                      "w-full rounded-2xl border p-4 text-left transition duration-200 sm:p-5",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/30",
                      isActive
                        ? "border-[#1E3A8A] bg-[#0f172a] text-white shadow-lg ring-1 ring-[#1E3A8A]/25"
                        : "border-[#E5E7EB] bg-white hover:-translate-y-0.5 hover:border-[#1E3A8A]/25 hover:shadow-md"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "line-clamp-2 text-sm font-semibold leading-snug sm:text-base",
                          isActive ? "text-white" : "text-[#111827]"
                        )}
                      >
                        {String(variant.variant_name ?? variant.name ?? `Variant ${idx + 1}`)}
                      </p>
                      {isActive ? (
                        <span className="shrink-0 rounded-full bg-[#F97316] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
                          Selected
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span
                        className={cn(
                          "inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold",
                          isActive ? "border-white/20 bg-white/10 text-white/90" : "border-[#E5E7EB] bg-[#F7F8FA] text-[#374151]"
                        )}
                      >
                        {String(variant.fuel_type ?? fuel)}
                      </span>
                      <span
                        className={cn(
                          "inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold",
                          isActive ? "border-white/20 bg-white/10 text-white/90" : "border-[#E5E7EB] bg-[#F7F8FA] text-[#374151]"
                        )}
                      >
                        {String(variant.transmission ?? "—")}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "relative mt-3 min-h-[4.5rem] border-t border-dashed pt-3",
                        isActive ? "border-white/20" : "border-[#E5E7EB]"
                      )}
                    >
                      {cardPriceLoading ? (
                        <div
                          className={cn(
                            "rounded-lg border border-dashed px-3 py-2.5 text-left",
                            isActive
                              ? "border-amber-400/40 bg-[#1e293b]/95"
                              : "border-[#93C5FD] bg-[#EFF6FF]"
                          )}
                        >
                          <p
                            className={cn(
                              "flex items-start gap-2 text-sm font-semibold leading-snug",
                              isActive ? "text-amber-50" : "text-[#1E3A8A]"
                            )}
                          >
                            <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                            <span>
                              {isActive ? (
                                <>
                                  Updating price for {debouncedTcoCity}. Or use{" "}
                                  <span className="font-bold">Get prices for all trims</span> above.
                                </>
                              ) : (
                                <>Tap to load the latest on-road price for {debouncedTcoCity}.</>
                              )}
                            </span>
                          </p>
                          <p className={cn("mt-2 text-xs leading-relaxed sm:text-sm", isActive ? "text-white/75" : "text-[#64748B]")}>
                            {isActive
                              ? "Your quote appears when the feed responds."
                              : "We fetch live pricing when you select this trim."}
                          </p>
                        </div>
                      ) : cardPriceError || showPriceLocked ? (
                        <div
                          className={cn(
                            "rounded-lg border border-dashed px-3 py-2.5 text-left",
                            isActive ? "border-white/30 bg-white/[0.07]" : "border-[#CBD5E1] bg-[#F8FAFC]"
                          )}
                        >
                          <p className={cn("text-sm font-semibold leading-snug", isActive ? "text-white" : "text-[#0F172A]")}>
                            {cardPriceError ? "Price didn’t load for this trim." : "Price not on this card yet."}
                          </p>
                          <p className={cn("mt-2 text-xs leading-relaxed sm:text-sm", isActive ? "text-white/75" : "text-[#64748B]")}>
                            {fetchAllTrimPrices
                              ? "We’ll show it when data is available."
                              : "Select this trim or use Get prices for all trims above."}
                          </p>
                        </div>
                      ) : (
                        <p className={cn("font-display text-2xl font-bold tabular-nums sm:text-3xl", isActive ? "text-[#FACC15]" : "text-[#F97316]")}>
                          {formatINR(apiPurchase!)}
                        </p>
                      )}
                      <p className={cn("text-sm", isActive ? "text-white/80" : "text-[#4B5563]")}>
                        Purchase · {debouncedTcoCity}
                      </p>
                    </div>
                    <ul className={cn("mt-3 space-y-1.5 text-sm", isActive ? "text-white/90" : "text-[#4B5563]")}>
                      {bullets.map((b) => (
                        <li key={b} className="flex gap-2">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#F97316]" aria-hidden />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                    <span className={cn("mt-4 inline-block text-sm font-semibold", isActive ? "text-[#FACC15]" : "text-[#1E3A8A]")}>
                      Trim details →
                    </span>
                  </button>
                );
              })}
            </div>
            )}
          </div>
        </div>
      </section>

      <section
        ref={(el) => {
          sectionRefs.current.specs = el;
        }}
        id="specs"
        className={cn("mx-auto max-w-[min(100%,92rem)] px-4 py-8 sm:px-6 lg:px-8", ANCHOR_SCROLL_CLASS)}
      >
        <div className="relative overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm ring-1 ring-black/[0.03]">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-[#1E3A8A] via-[#059669] to-[#F97316]/90"
            aria-hidden
          />
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-4 border-b border-[#E5E7EB] pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="flex min-w-0 gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#1E3A8A]/20 bg-[#EEF2FF] text-[#1E3A8A] sm:h-11 sm:w-11">
                  <Settings2 className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className={EYEBROW}>Specifications</p>
                  <h2 className={cn(SECTION_TITLE, "mt-1")}>This trim in detail</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-snug text-[#4B5563] sm:text-base">
                    Key numbers for the selected trim.
                  </p>
              </div>
          </div>
              {selectedVariantDisplayName ? (
                <div className="w-full shrink-0 rounded-lg border border-[#E5E7EB] bg-[#FAFBFC] px-3 py-2.5 shadow-inner sm:max-w-sm sm:text-right">
                  <p className={EYEBROW_MUTED}>Trim</p>
                  <p className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-[#111827] sm:text-base">
                    {selectedVariantDisplayName}
                  </p>
                </div>
              ) : null}
            </div>

            {selectedVariantFields.length === 0 ? (
              <div className="relative mt-6 min-h-[220px]">
                <div className="pointer-events-none grid grid-cols-2 gap-3 opacity-40 blur-[2px] sm:grid-cols-3 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-28 rounded-2xl bg-muted" />
                ))}
              </div>
                <DataAvailableSoonOverlay minHeight="min-h-[220px]" sectionLabel="Specifications" />
            </div>
            ) : (
              <>
                <div className="mt-4 overflow-x-auto rounded-xl border border-[#E5E7EB] bg-[#FAFBFC]/50">
                {!labelMaps ? (
                  <div className="grid gap-2 p-3 sm:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <table className="w-full min-w-[min(100%,520px)] border-collapse text-left text-sm">
                    <tbody>
                      {visibleVariantFields.map((field, i) => {
                        const g = specGroupHeading(field.key, labelMaps);
                        const prevG = i > 0 ? specGroupHeading(visibleVariantFields[i - 1]!.key, labelMaps) : null;
                        const showGroup = g !== prevG;
                        return (
                          <Fragment key={field.key}>
                            {showGroup ? (
                              <tr className="bg-[#EEF2FF]/80">
                                <td
                                  colSpan={2}
                                  className="border-b border-[#E5E7EB] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#1E3A8A] sm:px-4 sm:text-sm"
                                >
                                  {g}
                                </td>
                              </tr>
          ) : null}
                            <tr className="border-b border-[#E5E7EB] bg-white last:border-b-0 hover:bg-[#F8FAFC]">
                              <td className="w-[min(42%,11rem)] px-3 py-2 align-top font-medium text-[#6B7280] sm:px-4 sm:py-2.5">
                                {field.label}
                              </td>
                              <td className="px-3 py-2 text-right text-sm font-semibold leading-snug text-[#111827] wrap-anywhere sm:px-4 sm:py-2.5 sm:text-base">
                                {field.value}
                              </td>
                            </tr>
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                )}
                </div>
                {selectedVariantFields.length > SPECS_PREVIEW_COUNT ? (
                  <div className="mt-6 flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-12 rounded-xl gap-2 border-[#E5E7EB] bg-white px-5 text-base font-semibold"
                      onClick={() => setSpecsExpanded((v) => !v)}
                    >
                      {specsExpanded ? (
                        <>
                          Show less
                          <ChevronUp className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Show all {selectedVariantFields.length} specs
                          <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </Button>
            </div>
          ) : null}
              </>
            )}
          </div>
        </div>
      </section>

      <section
        ref={(el) => {
          sectionRefs.current.mileage = el;
        }}
        id="mileage"
        className={cn("mx-auto max-w-[min(100%,92rem)] px-4 py-8 sm:px-6 lg:px-8", ANCHOR_SCROLL_CLASS)}
      >
        <div className="rounded-3xl border border-border/70 bg-[#F8F9FB] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-400/90">Efficiency</p>
              <h2 className="font-display mt-2 text-lg font-bold text-foreground sm:text-xl">Mileage &amp; running costs</h2>
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
                From the catalogue for this trim. Real-world figures vary with traffic, load, and upkeep.
              </p>
                </div>
            <Fuel className="h-10 w-10 shrink-0 text-emerald-600/80" aria-hidden />
                </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {variantCore
              .filter((r) => ["mileage_kmpl", "fuel_type", "transmission"].includes(r.key))
              .map((r) => (
                <div
                  key={r.key}
                  className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition hover:shadow-md"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:text-sm">{r.label}</p>
                  <p className="mt-2 text-base font-bold text-foreground sm:text-lg">{r.value}</p>
                </div>
              ))}
              </div>
          <Button variant="outline" className="mt-6 min-h-12 rounded-xl px-5 text-base font-semibold" asChild>
            <a href="#specs">Full specifications</a>
          </Button>
        </div>
      </section>

      <section
        ref={(el) => {
          sectionRefs.current.colours = el;
        }}
        id="colours"
        className={cn("mx-auto max-w-[min(100%,92rem)] px-4 py-4 sm:px-6 lg:px-8", ANCHOR_SCROLL_CLASS)}
      >
        <div className="relative min-h-[200px] overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white p-6 sm:p-8">
          <div className="pointer-events-none select-none blur-[2px] opacity-50">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7F8FA]">
                <Palette className="h-6 w-6 text-[#9CA3AF]" aria-hidden />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-[#111827] sm:text-xl">Colours</h2>
                <p className="mt-2 text-sm text-[#4B5563] sm:text-base">Exterior and interior options from the catalogue.</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {[0, 1, 2].map((i) => (
                <span key={i} className="inline-flex h-9 min-w-[7rem] rounded-full border border-[#E5E7EB] bg-[#F7F8FA]" />
              ))}
            </div>
          </div>
          <DataAvailableSoonOverlay minHeight="min-h-[200px]" sectionLabel="Colours" />
        </div>
      </section>

      <section
        ref={(el) => {
          sectionRefs.current.features = el;
        }}
        id="features"
        className={cn("mx-auto max-w-[min(100%,92rem)] px-4 py-6 sm:px-6 sm:py-8 lg:px-8", ANCHOR_SCROLL_CLASS)}
      >
        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          <div className="border-b border-[#E5E7EB] bg-[#F7F8FA] px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className={EYEBROW}>Equipment</p>
                <h2 className={cn(SECTION_TITLE, "mt-2")}>Features by category</h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#4B5563] sm:text-base">
                  Browse by category, search, or highlight differences between trims. Yes / no / optional is shown clearly.
              </p>
            </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#6B7280] shadow-sm">
                  <Layers className="h-4 w-4 text-[#1E3A8A]" aria-hidden />
                  <span className="tabular-nums font-semibold text-[#111827]">{Object.keys(activeFeatureEntries).length}</span>
                  <span>in category</span>
                </div>
              </div>
            </div>
          </div>

          {sortedFeatureCategories.length ? (
            <div className="flex flex-col lg:flex-row lg:items-stretch">
              <aside className="border-b border-[#E5E7EB] bg-[#F7F8FA] lg:w-[min(100%,272px)] lg:shrink-0 lg:border-b-0 lg:border-r lg:border-[#E5E7EB]">
                <p className="px-4 pt-4 text-xs font-semibold uppercase tracking-wider text-[#6B7280] sm:text-sm lg:px-4 lg:pt-5">
                  Categories
                </p>
                <nav
                  className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-3 pb-3 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] touch-pan-x lg:flex-col lg:overflow-visible lg:px-3 lg:pb-4 lg:pt-2 lg:snap-none [&::-webkit-scrollbar]:hidden"
                  aria-label="Feature categories"
                >
                {sortedFeatureCategories.map((category) => {
                    const vis = getFeatureCategoryVisual(category);
                    const CatIcon = vis.Icon;
                  const active = category === activeFeatureCategory;
                    const count = Object.keys((featureBlocks[category] ?? {}) as Record<string, string>).length;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedFeatureCategory(category)}
                        className={cn(
                          "flex min-h-[52px] min-w-[156px] shrink-0 snap-start items-center gap-3 rounded-xl border px-3 py-3 text-left transition lg:min-w-0 lg:snap-none lg:w-full",
                        active
                            ? cn("border-[#E5E7EB] bg-white shadow-md ring-2", vis.railActive)
                            : "border-transparent hover:bg-white/90"
                        )}
                      >
                        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", vis.iconBg)}>
                          <CatIcon className={cn("h-5 w-5", vis.iconFg)} aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold leading-snug text-[#111827] sm:text-base">
                            {featureCategoryTitle(category)}
                          </span>
                          <span className="text-sm text-[#6B7280]">{count} items</span>
                        </span>
                    </button>
                  );
                })}
                </nav>
              </aside>

              <div className="min-w-0 flex-1 bg-white p-4 sm:p-5 lg:p-6">
                {(() => {
                  const catVis = getFeatureCategoryVisual(activeFeatureCategory);
                  const PanelIcon = catVis.Icon;
                  return (
                    <div className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-4 sm:flex-row sm:items-center sm:gap-4">
                      <span
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white sm:h-14 sm:w-14",
                          catVis.iconBg
                        )}
                      >
                        <PanelIcon className={cn("h-6 w-6 sm:h-7 sm:w-7", catVis.iconFg)} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-base font-bold tracking-tight text-[#111827] sm:text-lg">
                          {featureCategoryTitle(activeFeatureCategory)}
                        </h3>
                        <p className="mt-2 text-sm text-[#4B5563] sm:text-base">
                          Trim: <span className="font-semibold text-[#111827]">{selectedVariantDisplayName || "Selected"}</span>. Values from
                          the catalogue.
                        </p>
              </div>
                    </div>
                  );
                })()}

                <div
                  className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-3 text-sm text-[#4B5563] sm:gap-4 sm:px-4"
                  role="note"
                >
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#111827]">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
                    Yes / included
                  </span>
                  <span className="hidden h-3 w-px bg-[#E5E7EB] sm:inline" />
                  <span className="inline-flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 text-rose-600" aria-hidden />
                    No / not on trim
                  </span>
                  <span className="hidden h-3 w-px bg-[#E5E7EB] sm:inline" />
                  <span className="inline-flex items-center gap-1.5">
                    <MinusCircle className="h-4 w-4 text-amber-600" aria-hidden />
                    Optional / package
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#9CA3AF]" />
                  <Input
                    value={featureQuery}
                    onChange={(e) => setFeatureQuery(e.target.value)}
                      placeholder="Search features…"
                      className="min-h-12 rounded-xl border-[#E5E7EB] bg-white pl-10 text-base text-[#111827] shadow-sm placeholder:text-[#9CA3AF] focus-visible:ring-[#1E3A8A]/25"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setDiffOnly((v) => !v)}
                    className={cn(
                      "min-h-12 shrink-0 rounded-xl border px-4 text-base font-semibold transition",
                      diffOnly
                        ? "border-[#1E3A8A] bg-[#1E3A8A] text-white shadow-sm hover:bg-[#1e40af]"
                        : "border-[#E5E7EB] bg-white text-[#111827] hover:border-[#1E3A8A]/30 hover:bg-[#F7F8FA]"
                    )}
                  >
                    {diffOnly ? "Differences only" : "Highlight differences"}
                </button>
              </div>

                  {featureRows.length ? (
                  <ul className="mt-5 grid list-none gap-2.5 sm:grid-cols-2 sm:gap-3">
                      {featureRows.map(([name, value]) => {
                        const label = labelMaps ? labelForFeatureRowKey(name, labelMaps) : name;
                        const status = featureStatus(value);
                      const statusUi =
                        status === "available"
                          ? {
                              Icon: CheckCircle2,
                              ring: "ring-emerald-500/15",
                              border: "border-emerald-200/80",
                              iconBox: "bg-emerald-50",
                              iconClass: "text-emerald-600",
                            }
                          : status === "not_available"
                            ? {
                                Icon: XCircle,
                                ring: "ring-rose-500/15",
                                border: "border-rose-200/80",
                                iconBox: "bg-rose-50",
                                iconClass: "text-rose-600",
                              }
                            : {
                                Icon: MinusCircle,
                                ring: "ring-amber-500/20",
                                border: "border-amber-200/80",
                                iconBox: "bg-amber-50",
                                iconClass: "text-amber-700",
                              };
                      const SIcon = statusUi.Icon;
                        return (
                        <li
                          key={`${activeFeatureCategory}-${name}`}
                          className={cn(
                            "flex gap-3 rounded-xl border bg-white p-3.5 shadow-sm transition hover:shadow-md",
                            statusUi.border,
                            statusUi.ring,
                            "ring-1"
                          )}
                        >
                          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", statusUi.iconBox)}>
                            <SIcon className={cn("h-5 w-5", statusUi.iconClass)} aria-hidden />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold leading-snug text-[#111827]">{label}</p>
                            <p className="mt-1 text-sm leading-relaxed text-[#6B7280]">{value}</p>
                          </div>
                        </li>
                        );
                      })}
                  </ul>
                ) : (
                  <p className="mt-5 rounded-xl border border-dashed border-[#E5E7EB] bg-[#F7F8FA] px-4 py-8 text-center text-sm text-[#6B7280]">
                    No features match the current filter.
                  </p>
                )}
              </div>
                    </div>
                  ) : (
            <p className="px-4 py-10 text-center text-sm text-[#6B7280] sm:px-8">
              No feature blocks were returned for this variant.
            </p>
          )}
        </div>
      </section>

      <section
        ref={(el) => {
          sectionRefs.current.images = el;
        }}
        id="images"
        className={cn("mx-auto max-w-[min(100%,92rem)] px-4 py-8 sm:px-6 lg:px-8", ANCHOR_SCROLL_CLASS)}
      >
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={EYEBROW}>Gallery</p>
            <h2 className={cn(SECTION_TITLE, "mt-2")}>Images</h2>
            <p className="mt-3 text-sm text-[#4B5563] sm:text-base">Catalogue photos by trim. Pick a trim in Variants to refresh.</p>
          </div>
        </div>
        <div className="relative min-h-[200px]">
          <div
            className={cn(
              "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4",
              !hasCatalogueGalleryUrls && "pointer-events-none select-none blur-[2px] opacity-50"
            )}
          >
            {variants.slice(0, 8).map((v, idx) => {
              const src = String(v.hero_image_url ?? v.image_url ?? v.thumbnail_url ?? heroImage);
              const id = String(v.slug ?? v.id ?? idx);
              const active = id === String(selectedVariant.slug ?? selectedVariant.id ?? "");
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedSlug(id)}
                  className={cn(
                    "group relative aspect-4/3 overflow-hidden rounded-2xl border text-left transition",
                    active ? "border-emerald-500 ring-2 ring-emerald-500/25" : "border-border/60 hover:border-border"
                  )}
                >
                  <RemoteImageWithFallback
                    src={src || exteriorFallbackForKey(`${brand}-${model}`)}
                    alt={String(v.variant_name ?? v.name ?? model)}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    sizes="(max-width:640px) 50vw, 25vw"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-2 py-2">
                    <span className="line-clamp-2 text-xs font-medium text-white sm:text-sm">
                      {String(v.variant_name ?? v.name ?? "Variant")}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          {!hasCatalogueGalleryUrls ? (
            <DataAvailableSoonOverlay minHeight="min-h-[200px]" sectionLabel="Images" />
          ) : null}
        </div>
      </section>

      <section
        ref={(el) => {
          sectionRefs.current.video = el;
        }}
        id="video"
        className={cn("mx-auto max-w-[min(100%,92rem)] px-4 pb-8 sm:px-6 lg:px-8", ANCHOR_SCROLL_CLASS)}
      >
        <Card className="rounded-3xl border-border/70 bg-card shadow-sm ring-1 ring-black/[0.03]">
          <CardContent className="p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-400/90">
                  Indian Drive Guide
                </p>
                <h2 className="font-display mt-2 text-lg font-bold text-foreground sm:text-xl">Videos</h2>
                <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">{IDG_FEATURE_COPY.shortLine}</p>
              </div>
              <Button variant="outline" className="min-h-12 rounded-xl px-4 text-base font-semibold" asChild>
                <Link href={INDIAN_DRIVE_GUIDE_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                  <Play className="mr-1 h-4 w-4" /> Open channel
                </Link>
              </Button>
            </div>
            <IndianDriveGuidePlayer
              videoId={IDG_HOME_VIDEOS.clipSafetyA}
              title={`Indian Drive Guide for ${brand} ${model}`}
              autoplayWhenVisible
              layout="compact"
              className="mt-4"
            />
                </CardContent>
              </Card>
      </section>

      <section
        ref={(el) => {
          sectionRefs.current.reviews = el;
        }}
        id="reviews"
        className={cn("mx-auto max-w-[min(100%,92rem)] px-4 py-8 sm:px-6 lg:px-8", ANCHOR_SCROLL_CLASS)}
      >
        <div className="relative min-h-[180px] overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white p-6 sm:p-8">
          <div className="pointer-events-none select-none blur-[3px] opacity-50">
            <div className="flex flex-wrap items-center gap-3">
              <Star className="h-8 w-8 text-amber-500" aria-hidden />
              <div>
                <h2 className="font-display text-lg font-bold text-[#111827] sm:text-xl">Reviews</h2>
                <p className="mt-2 text-sm text-[#4B5563] sm:text-base">Owner and expert reviews will appear here when the feed is connected.</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="h-24 rounded-2xl bg-[#F7F8FA]" />
              <div className="h-24 rounded-2xl bg-[#F7F8FA]" />
            </div>
          </div>
          <DataAvailableSoonOverlay minHeight="min-h-[180px]" sectionLabel="Reviews" />
        </div>
      </section>

      <section
        ref={(el) => {
          sectionRefs.current.compare = el;
        }}
        id="compare"
        className={cn("mx-auto max-w-[min(100%,92rem)] px-4 py-6 sm:px-6 lg:px-8", ANCHOR_SCROLL_CLASS)}
      >
        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CarFront className="mt-0.5 h-8 w-8 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <h2 className="font-display text-lg font-bold text-foreground sm:text-xl">Compare</h2>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  Add this trim to compare, then open the workspace for a side-by-side view.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-12 rounded-xl px-4 text-base font-semibold"
                onClick={() => {
                  if (catalogueVariantId.length < 8) {
                    toast.message("This trim isn't on compare yet — try another variant or check back soon.");
                    return;
                  }
                  const ok = addVariantToCompare(catalogueVariantId);
                  if (!ok) toast.message("Compare is full (max 3).");
                  else window.location.href = "/compare";
                }}
              >
                <GitCompare className="mr-2 h-4 w-4" />
                Open compare
              </Button>
              <Button variant="secondary" className="min-h-12 rounded-xl px-4 text-base font-semibold" asChild>
                <Link href="/cars">Browse similar cars</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={(el) => {
          sectionRefs.current.expert = el;
        }}
        id="expert"
        className={cn("mx-auto max-w-[min(100%,92rem)] px-4 py-8 sm:px-6 lg:px-8", ANCHOR_SCROLL_CLASS)}
      >
        <ExpertConsultationSection
          placement="car-detail"
          trackSource="live_model_detail"
          vehicleLabel={`${brand} ${model} · ${selectedVariantDisplayName || "Selected trim"}`}
        />
      </section>

      <section className="mx-auto max-w-[min(100%,92rem)] px-4 pb-8 sm:px-6 lg:px-8">
        <Card className="rounded-3xl border-border/70 bg-card shadow-sm ring-1 ring-black/[0.03]">
          <CardContent className="p-5 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary sm:text-sm">Reference</p>
            <h2 className="font-display mt-2 text-lg font-bold text-foreground sm:text-xl">All catalogue fields</h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Model- and trim-level fields from the catalogue. Expand for full lists.
            </p>
            <Accordion type="multiple" className="mt-5">
              <AccordionItem value="model-fields" className="border-border/60">
                <AccordionTrigger className="text-base font-semibold hover:no-underline">Model-level data</AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {detailFields.map((field) => (
                      <p key={`df-${field.key}`} className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {labelMaps ? labelForVariantFieldKey(field.key, labelMaps) : field.label}:
                        </span>{" "}
                        {field.value}
                      </p>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="variant-fields" className="border-border/60">
                <AccordionTrigger className="text-base font-semibold hover:no-underline">All fields for this trim</AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {selectedVariantFields.map((field) => (
                      <p key={`vf-${field.key}`} className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{field.label}:</span> {field.value}
                      </p>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </section>

      <section
        ref={(el) => {
          sectionRefs.current.ai = el;
        }}
        id="ai"
        className={cn("mx-auto max-w-[min(100%,92rem)] px-4 py-8 sm:px-6 lg:px-8", ANCHOR_SCROLL_CLASS)}
      >
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-400/90">Autolokate AI</p>
          <h2 className="font-display mt-2 text-lg font-bold text-foreground sm:text-xl">Ask about this car</h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Answers use catalogue data for this trim. Good for quick questions before you speak to an expert.
          </p>
        </div>
        <CarDetailAiAssistant car={adaptAiCar(brand, model, bodyType, fuel, selectedVariant, purchasePriceFromTco)} />
      </section>

      <section className="border-t border-[#E5E7EB] bg-white">
        <div className="mx-auto flex max-w-[min(100%,92rem)] flex-wrap items-center justify-between gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <p className={EYEBROW_MUTED}>Next steps</p>
            <p className="font-display mt-2 text-lg font-bold text-[#111827] sm:text-xl">
              {brand} {model}
            </p>
            <p className="mt-1 text-sm text-[#4B5563] sm:text-base">
              {String(selectedVariant.variant_name ?? selectedVariant.name ?? "Selected trim")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="min-h-12 rounded-xl border-[#E5E7EB] px-5 text-base font-semibold" asChild>
              <Link href="/cars">Browse cars</Link>
            </Button>
            <Button className="min-h-12 rounded-xl bg-[#1E3A8A] px-5 text-base font-semibold text-white hover:bg-[#1e40af]" asChild>
              <Link href="/book-expert">Talk to an expert</Link>
            </Button>
          </div>
        </div>
      </section>

      {showStickyPriceBar ? (
        <div
          className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0f172a] px-4 py-3 shadow-[0_-12px_40px_-16px_rgba(0,0,0,0.25)]"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          role="region"
          aria-label="Current trim price"
        >
          <div className="mx-auto flex max-w-[min(100%,92rem)] flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70 sm:text-sm">
                {brand} {model} · {tcoCity}
              </p>
              <p className="truncate text-sm text-white/90">{selectedVariantDisplayName || "Selected trim"}</p>
              <p className="font-display text-xl font-bold tabular-nums text-[#FACC15] sm:text-2xl">
                {tcoPriceLoading ? "…" : purchasePriceFromTco ? formatINR(purchasePriceFromTco) : "—"}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button className="min-h-11 rounded-xl bg-[#F97316] px-4 text-sm font-semibold text-white hover:bg-[#ea580c] sm:min-h-12 sm:px-5 sm:text-base" asChild>
                <a href="#pricing">Price &amp; EMI</a>
              </Button>
              <Button
                variant="secondary"
                className="min-h-11 rounded-xl border-0 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/20 sm:min-h-12 sm:px-5 sm:text-base"
                asChild
              >
                <Link href="/book-expert">Expert</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
