import type { Metadata } from "next";
import { AboutPageClient } from "@/components/about/about-page-client";

export const metadata: Metadata = {
  title: "About Autolokate — Building a Safer Vehicle Community",
  description:
    "Autolokate is a free, privacy-first platform that helps vehicle owners manage their vehicles, share trips and expenses, and stay prepared for emergencies — without giving up control of their data.",
};

export default function AboutPage() {
  return <AboutPageClient />;
}
