import type { Metadata } from "next";
import { DownloadPageClient } from "@/components/download/download-page-client";
import { SITE_NAME } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Download ${SITE_NAME} — Safety & Privacy for your Vehicle`,
  description: `Get the ${SITE_NAME} app on Android and iOS. Manage your vehicle, hide your phone number with QR contact, and join an expert community trusted by 2M+ Indian drivers.`,
  alternates: {
    canonical: "/download",
  },
  openGraph: {
    title: `Download ${SITE_NAME}`,
    description: `One app for total vehicle safety — available on Google Play and the App Store.`,
    url: "/download",
    type: "website",
  },
};

export default function DownloadPage() {
  return <DownloadPageClient />;
}
