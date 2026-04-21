import type { Metadata } from "next";
import { Suspense } from "react";
import { TestDriveFlow } from "@/components/test-drive/test-drive-flow";

export const metadata: Metadata = {
  title: "Book test drive",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>}>
      <TestDriveFlow />
    </Suspense>
  );
}
