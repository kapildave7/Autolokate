import carImagePools from "@/data/json/car-image-pools.json";

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

/**
 * Deterministic real-vehicle stock URL for a listing id, slug, or key — avoids one global image sitewide.
 * Pool is shared with `car-image-pools.json` / `npm run generate-data`.
 */
export function exteriorFallbackForKey(key: string): string {
  const urls = carImagePools.exteriors;
  if (!urls.length) return "";
  const idx = Math.abs(hashString(key || "autolokate")) % urls.length;
  return urls[idx]!;
}

export function interiorFallbackForKey(key: string): string {
  const urls = carImagePools.interiors;
  if (!urls.length) return exteriorFallbackForKey(key);
  const idx = Math.abs(hashString(`in:${key}`)) % urls.length;
  return urls[idx]!;
}
