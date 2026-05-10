import type { Metadata } from "next";
import Link from "next/link";
import { PageFade } from "@/components/shared/page-fade";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Shipping policy",
  description: `How ${SITE_NAME} fulfils physical orders — dispatch timelines, couriers, and tracking.`,
  alternates: { canonical: "/shipping-policy" },
};

export default function ShippingPolicyPage() {
  return (
    <PageFade>
      <main className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Shipping policy
        </h1>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
          <p>
            Official {SITE_NAME} QR sticker orders are packed at our warehouse and handed to trusted
            pan-India courier partners. Most orders ship within one business day after confirmation;
            remote pin codes may need an extra day or two.
          </p>
          <p>
            You receive tracking information by SMS or email (where provided) once the shipment is
            booked. If a courier attempt fails, the carrier usually retries according to their
            policy; contact us if you need the shipment redirected or held.
          </p>
          <p>
            Shipping charges, if any, are shown before you complete checkout.{" "}
            {SITE_NAME} may run promotions that include free shipping — see the shop or checkout
            page for current offers.
          </p>
          <p>
            For damaged parcels, wrong items, or long delays, reach out through{" "}
            <Link href="/contact" className="font-semibold text-primary underline-offset-4 hover:underline">
              Contact
            </Link>{" "}
            with your order details and photos where helpful.
          </p>
        </div>
        <div className="mt-10">
          <Button asChild>
            <Link href="/contact">Contact support</Link>
          </Button>
        </div>
      </main>
    </PageFade>
  );
}
