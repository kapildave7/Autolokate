import type { Metadata } from "next";
import { ContactPageClient } from "@/components/contact/contact-page-client";
import { SITE_NAME } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Contact us — ${SITE_NAME}`,
  description: `Talk to the ${SITE_NAME} team about partnerships, product, press, or support. We reply to most enquiries within one business day.`,
};

export default function ContactPage() {
  return <ContactPageClient />;
}
