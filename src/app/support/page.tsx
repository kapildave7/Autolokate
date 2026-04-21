import type { Metadata } from "next";
import { SupportGrievanceView } from "@/components/support/support-grievance-view";

export const metadata: Metadata = {
  title: "Support — grievances",
  description: "Submit a grievance and track your tickets — see status for cases you’ve raised while signed in.",
};

export default function SupportPage() {
  return <SupportGrievanceView />;
}
