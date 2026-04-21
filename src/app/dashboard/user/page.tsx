import type { Metadata } from "next";
import { UserDashboard } from "@/components/dashboard/user-dashboard";

export const metadata: Metadata = {
  title: "My dashboard",
};

export default function Page() {
  return <UserDashboard />;
}
