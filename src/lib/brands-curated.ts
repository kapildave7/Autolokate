import { cars, bikes } from "@/data";
import { slugifyPart } from "@/lib/seo/slugs";

export type CuratedBrandKind = "cars" | "motorcycles" | "scooters";

export type CuratedBrand = {
  name: string;
  kind: CuratedBrandKind;
  logo: string;
};

export const curatedBrands: CuratedBrand[] = [
  { name: "Maruti Suzuki", kind: "cars", logo: "/brands/maruti-suzuki.svg" },
  { name: "KTM", kind: "motorcycles", logo: "/brands/ktm.svg" },
  { name: "Mahindra", kind: "cars", logo: "/brands/mahindra.svg" },
  { name: "Royal Enfield", kind: "motorcycles", logo: "/brands/royal-enfield.svg" },
  { name: "Hyundai", kind: "cars", logo: "/brands/hyundai.svg" },
  { name: "Hero", kind: "motorcycles", logo: "/brands/hero.svg" },
  { name: "Tata", kind: "cars", logo: "/brands/tata.svg" },
  { name: "TVS", kind: "motorcycles", logo: "/brands/tvs.svg" },
  { name: "Ather", kind: "scooters", logo: "/brands/ather.svg" },
  { name: "Skoda", kind: "cars", logo: "/brands/skoda.svg" },
  { name: "Toyota", kind: "cars", logo: "/brands/toyota.svg" },
  { name: "Honda", kind: "cars", logo: "/brands/honda.svg" },
];

export function curatedBrandSlug(name: string) {
  return slugifyPart(name);
}

export function getBrandInsight(name: string, kind: CuratedBrandKind): string {
  if (kind === "cars") {
    const list = cars.filter((c) => c.brand.toLowerCase() === name.toLowerCase());
    if (!list.length) return "Editorial + model pages coming next";
    const models = new Set(list.map((c) => c.model));
    const colors = new Set(list.map((c) => c.exteriorColor));
    return `${models.size} models · ${colors.size} colors`;
  }
  const list = bikes.filter((b) => b.brand.toLowerCase() === name.toLowerCase());
  if (!list.length) return "Editorial + model pages coming next";
  const models = new Set(list.map((b) => b.model));
  const colors = new Set(list.flatMap((b) => b.colors ?? []));
  return `${models.size} models · ${Math.max(colors.size, 1)} colors`;
}
