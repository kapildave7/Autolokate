import type { Metadata } from "next";
import { redirect } from "next/navigation";
// import Link from "next/link";
// import { Suspense } from "react";
// import { indianCities } from "@/data";
// import { CarsGridSkeleton } from "@/components/cars/cars-grid-skeleton";
// import { CarsPage } from "@/components/cars/cars-page";
// import { cityToSlug } from "@/lib/seo/resolvers";

/** Used inventory hub disabled — research platform only. */
export const metadata: Metadata = {
  title: "Used Cars in India — Buy Second Hand Cars at Best Price",
  description:
    "Browse verified used cars across Indian cities. Compare prices, mileage, specs, and features. Dealer and owner listings with transparent history.",
  keywords:
    "used cars India, second hand cars, pre-owned cars, certified used cars, buy used car online, Autolokate",
};

export default function UsedCarsHubPage() {
  redirect("/");
}
