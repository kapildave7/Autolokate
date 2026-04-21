import type { Metadata } from "next";
import { redirect } from "next/navigation";
// import Link from "next/link";
// import { Suspense } from "react";
// import { brands } from "@/data";
// import { CarsGridSkeleton } from "@/components/cars/cars-grid-skeleton";
// import { CarsPage } from "@/components/cars/cars-page";
// import { newCarsBrandPath } from "@/lib/seo/paths";

/** New car listings hub disabled — research platform only. */
export const metadata: Metadata = {
  title: "New Cars in India — Latest Models, Prices & Variants",
  description:
    "Explore new car listings by brand and model. Compare variants, features, mileage, and on-road price bands across Indian cities.",
  keywords: "new cars India, latest car models, car prices India, new car variants, Autolokate",
};

export default function NewCarsHubPage() {
  redirect("/");
}
