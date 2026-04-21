import type { Car } from "@/data/types";

const FUELS: Car["fuel"][] = ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"];
const TRANSMISSIONS: Car["transmission"][] = ["Manual", "Automatic", "CVT", "DCT", "e-CVT"];

function str(v: unknown, max = 500): string {
  if (typeof v !== "string") return "";
  return v.length > max ? v.slice(0, max) : v;
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * When `/api/cars/ai-chat` receives a `carId` that is not in static demo data (e.g. live catalogue
 * model pages), the client may send the same `Car` snapshot it uses for UI (`companyId: "catalogue"`).
 * This validates and normalizes that payload server-side.
 */
export function coerceClientCarForAi(carId: string, raw: unknown): Car | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (str(o.id, 120) !== carId) return null;
  if (str(o.companyId, 64) !== "catalogue") return null;

  const brand = str(o.brand, 80);
  const model = str(o.model, 80);
  const variant = str(o.variant, 120);
  if (!brand || !model || !variant) return null;

  const emptySpecs: Record<string, string> =
    o.specs && typeof o.specs === "object" && !Array.isArray(o.specs)
      ? Object.fromEntries(
          Object.entries(o.specs as Record<string, unknown>)
            .slice(0, 48)
            .map(([k, val]) => [String(k).slice(0, 64), String(val ?? "").slice(0, 400)])
        )
      : {};

  const car: Car = {
    id: carId,
    companyId: "catalogue",
    brand,
    model,
    variant,
    year: Math.min(2030, Math.max(1990, Math.round(num(o.year)) || new Date().getFullYear())),
    price: Math.max(0, num(o.price)),
    listPrice: Math.max(0, num(o.listPrice ?? o.price)),
    discountPercent: Math.min(100, Math.max(0, Math.round(num(o.discountPercent)))),
    fuel: (FUELS.includes(str(o.fuel, 32) as Car["fuel"]) ? str(o.fuel, 32) : "Petrol") as Car["fuel"],
    transmission: (TRANSMISSIONS.includes(str(o.transmission, 32) as Car["transmission"])
      ? str(o.transmission, 32)
      : "Manual") as Car["transmission"],
    kms: Math.max(0, Math.round(num(o.kms))),
    owners: Math.max(0, Math.round(num(o.owners))),
    city: str(o.city, 80) || "India",
    sellerType: (str(o.sellerType, 24) || "Dealer") as Car["sellerType"],
    exteriorColor: str(o.exteriorColor, 48) || "—",
    images: Array.isArray(o.images) ? o.images.filter((x): x is string => typeof x === "string").slice(0, 24) : [],
    engine: str(o.engine, 64) || "N/A",
    power: str(o.power, 64) || "N/A",
    torque: str(o.torque, 64) || "N/A",
    mileage: str(o.mileage, 64) || "N/A",
    bodyType: str(o.bodyType, 48) || "—",
    features: Array.isArray(o.features) ? o.features.filter((x): x is string => typeof x === "string").slice(0, 40) : [],
    specs: emptySpecs,
    certified: Boolean(o.certified),
    isNew: o.isNew !== false,
    trending: Boolean(o.trending),
    addedAt: typeof o.addedAt === "string" ? o.addedAt.slice(0, 40) : new Date().toISOString(),
    reviews: [],
    estimatedEmiMonthly: Math.max(0, num(o.estimatedEmiMonthly)),
    priceHistory: [],
    videoTitle: str(o.videoTitle, 120),
    inspectionReport: [],
    ownershipTimeline: [],
    serviceTimeline: [],
    pros: [],
    cons: [],
    whyBuy: [],
    carbonScore: Math.min(100, Math.max(0, Math.round(num(o.carbonScore)))),
    matchProfileKey: str(o.matchProfileKey, 64) || "catalogue",
  };

  return car;
}
