import type { Metadata } from "next";
import { DealerDashboard } from "@/components/dashboard/dealer-dashboard";

export const metadata: Metadata = {
  title: "Dealer dashboard",
};

export default function Page() {
  return <DealerDashboard />;
}
