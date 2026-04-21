import type { Metadata } from "next";
import { BackendStatusView } from "@/components/status/backend-status-view";

export const metadata: Metadata = {
  title: "API status",
  description: "Autolokate backend liveness and readiness (staging API).",
};

export default function StatusPage() {
  return <BackendStatusView />;
}
