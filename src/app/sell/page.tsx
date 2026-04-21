import type { Metadata } from "next";
import { redirect } from "next/navigation";
// import { SellFlow } from "@/components/sell/sell-flow";

/** Marketplace sell flow disabled — Autolokate is research-only. Route blocked in middleware. */
export const metadata: Metadata = {
  title: "Sell your car",
  description: "List your car with guided steps and an estimated valuation.",
};

export default function SellPage() {
  redirect("/");
}
