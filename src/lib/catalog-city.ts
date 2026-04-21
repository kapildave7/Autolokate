/** Map geo / IP city names to catalog cities used in listings. */
const CITY_ALIASES: Record<string, string> = {
  bangalore: "Bengaluru",
  bengaluru: "Bengaluru",
  bombay: "Mumbai",
  "new delhi": "Delhi",
  gurgaon: "Delhi",
  gurugram: "Delhi",
  noida: "Delhi",
  "greater noida": "Delhi",
  ghaziabad: "Delhi",
  faridabad: "Delhi",
  calcutta: "Kolkata",
  madras: "Chennai",
  bhubaneswar: "Kolkata",
  visakhapatnam: "Hyderabad",
  vizag: "Hyderabad",
  secunderabad: "Hyderabad",
  thane: "Mumbai",
  navi: "Mumbai",
  "navi mumbai": "Mumbai",
};

export function matchCityToCatalog(raw: string | null | undefined, catalog: readonly string[]): string | null {
  if (!raw) return null;
  const t = raw.trim().toLowerCase();
  const viaAlias = CITY_ALIASES[t];
  if (viaAlias && catalog.includes(viaAlias)) return viaAlias;
  const direct = catalog.find((c) => c.toLowerCase() === t);
  return direct ?? null;
}

export async function fetchCityFromGeoPosition(): Promise<string | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          if (!res.ok) {
            resolve(null);
            return;
          }
          const data = (await res.json()) as { city?: string; locality?: string };
          resolve(data.city || data.locality || null);
        } catch {
          resolve(null);
        }
      },
      () => resolve(null),
      { maximumAge: 600_000, timeout: 10_000, enableHighAccuracy: false }
    );
  });
}

export async function fetchCityFromIp(): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = window.setTimeout(() => ctrl.abort(), 7000);
    const res = await fetch("https://ipapi.co/json/", { signal: ctrl.signal });
    window.clearTimeout(t);
    if (!res.ok) return null;
    const data = (await res.json()) as { city?: string };
    return data.city || null;
  } catch {
    return null;
  }
}
