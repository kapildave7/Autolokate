import type { Metadata } from "next";
import { HowToUsePageClient } from "@/components/how-to-use/how-to-use-page-client";
import { SITE_NAME } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `How to Use ${SITE_NAME} QR — Get set up in minutes`,
  description: `Learn how to set up and use ${SITE_NAME} QR. A simple, four-step guide covering owner setup, scanning, secure communication, and emergency notifications.`,
};

export default function HowToUsePage() {
  return <HowToUsePageClient />;
}
