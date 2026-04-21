import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutConfirmation } from "@/components/checkout/checkout-confirmation";

export const metadata: Metadata = {
  title: "Order confirmed",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>}>
      <CheckoutConfirmation />
    </Suspense>
  );
}
