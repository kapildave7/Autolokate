import type { Metadata } from "next";
import { Suspense } from "react";
import { AiAccessActivateClient } from "./activate-client";

export const metadata: Metadata = {
  title: "Activating Autolokate AI",
  robots: { index: false, follow: false },
};

export default function AiAccessActivatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Activating your access…
        </div>
      }
    >
      <AiAccessActivateClient />
    </Suspense>
  );
}
