"use client";

import Image from "next/image";
import Link from "next/link";
import { GA_CATEGORIES, trackEvent } from "@/lib/analytics";

const footerSections: { title: string; links: { href: string; label: string; id: string }[] }[] = [
  {
    title: "Research",
    links: [
      { href: "/compare", label: "Compare", id: "compare" },
      { href: "/companies", label: "Dealers", id: "dealers" },
      { href: "/media", label: "Media house", id: "media" },
      { href: "/blog", label: "Stories", id: "blog" },
      { href: "/community", label: "Community", id: "community" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About", id: "about" },
      { href: "/contact", label: "Contact", id: "contact" },
      { href: "/support", label: "Support", id: "support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy", id: "privacy" },
      { href: "/terms", label: "Terms", id: "terms" },
      { href: "/refund-policy", label: "Refunds", id: "refund" },
      { href: "/status", label: "API status", id: "status" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative z-1 border-t border-border bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:gap-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center"
            onClick={() =>
              trackEvent("footer_nav_click", {
                event_category: GA_CATEGORIES.navigation,
                event_label: "logo_home",
                link_href: "/",
              })
            }
          >
            <Image
              src="https://autolokate.com/autolokate_light.png"
              alt="Autolokate"
              width={120}
              height={32}
              className="h-6 w-auto sm:h-7"
            />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            A premium automotive research experience — compare specs, read expert media, and explore stories built for
            confident buying. Demo data only.
          </p>
        </div>
        {footerSections.map((section) => (
          <div key={section.title}>
            <p className="text-sm font-semibold text-foreground">{section.title}</p>
            <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
              {section.links.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="-mx-1 block rounded-md px-1 py-2 transition hover:bg-secondary/80 hover:text-primary sm:py-1.5"
                    onClick={() =>
                      trackEvent("footer_nav_click", {
                        event_category: GA_CATEGORIES.navigation,
                        event_label: item.id,
                        link_href: item.href,
                        section: section.title.toLowerCase(),
                      })
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Autolokate · Research & decision tools · No transactions
      </div>
    </footer>
  );
}
