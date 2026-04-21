import type { Metadata } from "next";
import { BrandsDirectoryPage } from "@/components/brands/brands-directory-page";

export const metadata: Metadata = {
  title: "Explore by brand",
  description:
    "Browse every car maker in the Autolokate catalog. Tap a brand to see all listings with full filters — price, fuel, body type, city, and more.",
  keywords: "car brands India, browse by brand, Maruti Hyundai Tata, car inventory by maker",
};

export default function BrandsPage() {
  return <BrandsDirectoryPage />;
}
