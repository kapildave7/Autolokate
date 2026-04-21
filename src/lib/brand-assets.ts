import { slugifyPart } from "@/lib/seo/slugs";

/** Map slugify(API display name) → canonical logo map key (e.g. tata-motors → tata). */
const BRAND_LOGO_SLUG_ALIASES: Record<string, string> = {
  maruti: "maruti-suzuki",
  "tata-motors": "tata",
  "bajaj-auto": "bajaj",
  "skoda-auto": "skoda",
  mercedes: "mercedes-benz",
  "mercedes-benz-india": "mercedes-benz",
  vw: "volkswagen",
  "bmw-india": "bmw",
  "audi-india": "audi",
  "hero-motocorp": "hero",
  "hyundai-motor-india": "hyundai",
  "honda-cars-india": "honda",
  "toyota-kirloskar": "toyota",
  "kia-india": "kia",
  "nissan-india": "nissan",
  "renault-india": "renault",
  "volkswagen-india": "volkswagen",
  "porsche-india": "porsche",
  "citroen-india": "citroen",
  "jeep-india": "jeep",
  "mg-motor-india": "mg",
};

/** Remote brand marks (Wikimedia Commons, Simple Icons, World Vector Logo). Slug keys from {@link slugifyPart}. */
const BRAND_LOGO_REMOTE: Record<string, string> = {
  audi: "https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg",
  bmw: "https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg",
  citroen: "https://cdn.simpleicons.org/citroen",
  honda: "https://cdn.simpleicons.org/honda",
  hyundai: "https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg",
  jeep: "https://cdn.simpleicons.org/jeep",
  kia: "https://cdn.simpleicons.org/kia",
  "land-rover": "https://cdn.worldvectorlogo.com/logos/land-rover-1.svg",
  mg: "https://cdn.simpleicons.org/mg",
  "mg-morris-garages": "https://cdn.simpleicons.org/mg",
  mahindra: "https://cdn.simpleicons.org/mahindra",
  "maruti-suzuki": "https://cdn.simpleicons.org/suzuki",
  "mercedes-benz": "https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg",
  nissan: "https://cdn.simpleicons.org/nissan",
  porsche: "https://cdn.simpleicons.org/porsche",
  renault: "https://cdn.simpleicons.org/renault",
  skoda: "https://cdn.simpleicons.org/skoda",
  tata: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Tata_logo.svg",
  toyota: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg",
  volkswagen: "https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg",
  volvo: "https://cdn.simpleicons.org/volvo",
};

/** Local assets (e.g. two-wheeler brands) — used when no remote entry. */
const BRAND_LOGO_LOCAL: Record<string, string> = {
  ktm: "/brands/ktm.svg",
  "royal-enfield": "/brands/royal-enfield.svg",
  hero: "/brands/hero.svg",
  tvs: "/brands/tvs.svg",
  ather: "/brands/ather.svg",
  bajaj: "/brands/bajaj.svg",
  yamaha: "/brands/yamaha.svg",
  ultraviolette: "/brands/ultraviolette.svg",
};

export function getBrandLogo(brand: string): string | null {
  const key = slugifyPart(brand.trim());
  const canonical = BRAND_LOGO_SLUG_ALIASES[key];
  return (
    (canonical != null ? BRAND_LOGO_REMOTE[canonical] ?? BRAND_LOGO_LOCAL[canonical] : null) ??
    BRAND_LOGO_REMOTE[key] ??
    BRAND_LOGO_LOCAL[key] ??
    null
  );
}

export function isRemoteBrandLogo(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}
