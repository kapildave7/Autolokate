import type { Metadata } from "next";
import { BookingsHistoryPageClient } from "@/components/book-expert/bookings-history-page-client";

export const metadata: Metadata = {
  title: "Your bookings — Autolokate",
  description: "View active expert booking details and complete booking history, including payment and slot information.",
};

export default function BookExpertBookingsPage() {
  return <BookingsHistoryPageClient />;
}
