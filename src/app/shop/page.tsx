import type { Metadata } from "next";
import { ShopPageClient } from "@/components/shop/shop-page-client";
import { SITE_NAME } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Shop — ${SITE_NAME} QR Stickers`,
  description: `Order official ${SITE_NAME} QR stickers for bikes and cars. Private parking contact, durable weatherproof vinyl, quantity packs with free shipping.`,
  alternates: {
    canonical: "/shop",
  },
  openGraph: {
    title: `Shop ${SITE_NAME}`,
    description: `Premium QR stickers for two-wheelers and four-wheelers — shipped fast, privacy-first.`,
    url: "/shop",
    type: "website",
  },
};

export default function ShopPage() {
  return <ShopPageClient />;
}
