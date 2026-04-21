import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";

export const metadata: Metadata = {
  title: "Checkout",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-muted-foreground">Loading checkout…</div>}>
      <CheckoutFlow />
    </Suspense>
  );
}
