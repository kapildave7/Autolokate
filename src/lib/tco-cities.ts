/** Cities supported by the pricing / TCO API (aligned with `LiveModelPricingInsights`). */
export const TCO_CITIES = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Kolkata",
  "Ahmedabad",
] as const;

const CITY_ALIASES: Record<string, string> = {
  bangalore: "Bengaluru",
  bengaluru: "Bengaluru",
  mumbai: "Mumbai",
  delhi: "Delhi",
  hyderabad: "Hyderabad",
  chennai: "Chennai",
  pune: "Pune",
  kolkata: "Kolkata",
  ahmedabad: "Ahmedabad",
};

export function matchPreferenceCity(raw: string | undefined): string | null {
  const t = raw?.trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  if (CITY_ALIASES[lower]) return CITY_ALIASES[lower];
  const title = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  return TCO_CITIES.includes(title as (typeof TCO_CITIES)[number]) ? title : null;
}
