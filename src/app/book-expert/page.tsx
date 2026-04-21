import type { Metadata, Viewport } from "next";
import { BookExpertPageClient } from "@/components/book-expert/book-expert-page-client";

export const metadata: Metadata = {
  title: "Book a car expert — Autolokate",
  description:
    "15-minute advisor call with guidance rooted in Indian Drive Guide founder Deepak Chaudhary’s approach: shortlist, budget, variant clarity, and your next step. Pay with Razorpay — slot confirmed after payment.",
};

export const viewport: Viewport = {
  themeColor: "#050506",
};

export default function BookExpertPage() {
  return <BookExpertPageClient />;
}
