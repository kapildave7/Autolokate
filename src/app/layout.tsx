import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppChrome } from "@/components/layout/app-chrome";
import { AnalyticsPlaceholder } from "@/components/seo/analytics-placeholder";
import { JsonLdScript, organizationJsonLd, webSiteJsonLd } from "@/components/seo/json-ld";
import { GaPageTracker } from "@/components/analytics/ga-page-tracker";
import { SITE_NAME } from "@/lib/seo/site";
import { themeBootstrapScript } from "@/providers/theme-provider";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.autolokate.com"),
  title: {
    default: `${SITE_NAME} — Car research & comparison`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Compare cars in India by price, mileage, fuel, and specs. Browse used and new listings by city, read guides, and shortlist with AI — research-first, built for Indian buyers.",
  keywords: [
    "cars India",
    "car price India",
    "compare cars",
    "used cars India",
    "car specs mileage",
    "buy car online research",
    "SUV sedan hatchback India",
    SITE_NAME,
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    title: `${SITE_NAME} — Compare cars, prices & specs in India`,
    description:
      "Research cars with filters, side-by-side compare, detailed listings, and expert booking — structured for how people search in India.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Car research & comparison for India`,
    description: "Browse listings, compare models, and decide with specs, FAQs, and tools built for Indian buyers.",
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  applicationName: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  category: "automotive",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0a0a0f" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script
          // Synchronous: runs before <body> paints so the chosen theme is on <html>
          // immediately and there is no light/dark flash on reload.
          dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
        />
      </head>
      <body
        className="min-h-screen bg-background font-sans text-foreground antialiased font-features-['cv02','cv03','cv04','cv11']"
        suppressHydrationWarning
      >
        <JsonLdScript data={[organizationJsonLd(), webSiteJsonLd()]} />
        <AnalyticsPlaceholder />
        <Suspense fallback={null}>
          <GaPageTracker />
        </Suspense>
        <Providers>
          <AppChrome>{children}</AppChrome>
        </Providers>
      </body>
    </html>
  );
}
