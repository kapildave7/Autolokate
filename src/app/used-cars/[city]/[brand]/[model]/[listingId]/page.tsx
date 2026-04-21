import { notFound, redirect } from "next/navigation";
import { getCarById } from "@/data";
import { carDetailPath } from "@/lib/seo/paths";
import { resolveBrandFromSlug, resolveCityFromSlug, resolveModelFromSlug } from "@/lib/seo/resolvers";

type Props = {
  params: Promise<{ city: string; brand: string; model: string; listingId: string }>;
};

/** Nested listing URL → canonical /cars/{seo-slug} for single source of truth. */
export default async function UsedCarsListingAliasPage({ params }: Props) {
  const { city, brand, model, listingId } = await params;
  const car = getCarById(listingId);
  if (!car) notFound();

  const cityLabel = resolveCityFromSlug(city);
  const brandLabel = resolveBrandFromSlug(brand);
  const modelLabel = brandLabel ? resolveModelFromSlug(brandLabel, model) : null;
  if (!cityLabel || !brandLabel || !modelLabel) notFound();
  if (car.city !== cityLabel || car.brand !== brandLabel || car.model !== modelLabel) notFound();

  redirect(carDetailPath(car));
}
