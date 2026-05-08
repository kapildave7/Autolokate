"use client";

import Image from "next/image";
import Link from "next/link";
import { Youtube } from "lucide-react";
import { GA_CATEGORIES, trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type FooterLink = { href: string; label: string; id: string; badge?: string };

const footerSections: { title: string; links: FooterLink[] }[] = [
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
      { href: "/contact", label: "Careers", id: "careers", badge: "We're hiring" },
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

/** Minimal brand marks — keep stroke consistent with lucide sizing. */
function IconFacebook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M13.5 9H15V6.5c0-.3 0-1 .1-1.4.2-1.5 1.1-2.9 2.4-3.6 1-.6 2.2-.8 3.5-.8V0h-2.2c-2.4 0-4.6 1-5.9 2.9-.7 1-1 2.1-1 3.5V9h-3v4h3v11h4V13h3.1l.2-4h-3.4V7.2c0-.5 0-1 .2-1.4.3-.8 1-1.2 2-1.2.1 0 .8 0 1.5.1V9z" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M18.9 3h3.2l-7 8.2L23 21h-6.2l-5-6.5L6.5 21H3.3l7.5-8.8L3 3h6.3l4.5 5.9L18.9 3Z" />
    </svg>
  );
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.4 3.4 0 0 0 4 7.4v9.2A3.4 3.4 0 0 0 7.4 20h9.2a3.4 3.4 0 0 0 3.4-3.4V7.4A3.4 3.4 0 0 0 16.6 4H7.6m9.9 1.4a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </svg>
  );
}

const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/",
    Icon: IconFacebook,
  },
  {
    label: "X",
    href: "https://x.com/",
    Icon: IconX,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/",
    Icon: IconInstagram,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@IndianDriveGuide",
    Icon: Youtube,
  },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative isolate z-1 overflow-hidden border-t border-border/60 text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <Image
          src="/images/footer_bg_light.png"
          alt=""
          fill
          sizes="100vw"
          className="theme-light-only object-cover object-[88%_center] opacity-100"
        />
        <Image
          src="/images/footer_bg_dark.png"
          alt=""
          fill
          sizes="100vw"
          className="theme-dark-only object-cover object-[88%_center] opacity-100"
        />
        <div className="absolute inset-0 bg-linear-to-r from-background from-[0%] via-background/92 to-background/25 lg:via-background/85 lg:to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pt-14 pb-3 sm:px-6 sm:pt-16 sm:pb-4">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10 lg:gap-y-12">
          <div className="min-w-0 lg:col-span-5">
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
                src="https://autolokate.com/autolokate_dark.png"
                alt="Autolokate"
                width={140}
                height={36}
                className="theme-dark-only h-7 w-auto sm:h-8"
              />
              <Image
                src="https://autolokate.com/autolokate_light.png"
                alt="Autolokate"
                width={140}
                height={36}
                className="theme-light-only h-7 w-auto sm:h-8"
              />
            </Link>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
              A premium automotive research experience — compare specs, read expert media, and explore stories built
              for confident buying. Demo data only.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2.5" aria-label="Social links">
              {socialLinks.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={cn(
                      "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground transition",
                      "hover:border-primary/40 hover:bg-primary/10 hover:text-primary",
                      "theme-dark-only:border-white/10 theme-dark-only:bg-black/40 theme-dark-only:hover:bg-white/10"
                    )}
                    onClick={() =>
                      trackEvent("footer_nav_click", {
                        event_category: GA_CATEGORIES.navigation,
                        event_label: `social_${label.toLowerCase()}`,
                        link_href: href,
                      })
                    }
                  >
                    {label === "YouTube" ? (
                      <Youtube className="h-[18px] w-[18px]" strokeWidth={1.5} />
                    ) : (
                      <Icon className="h-[18px] w-[18px]" />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {footerSections.map((section, si) => (
            <div
              key={section.title}
              className={cn(
                "min-w-0 lg:border-l lg:border-border/40 lg:pl-8",
                si === 2 ? "lg:col-span-3" : "lg:col-span-2"
              )}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary sm:text-xs">{section.title}</p>
              <ul className="mt-4 space-y-0.5">
                {section.links.map((item) => (
                  <li key={`${section.title}-${item.id}`}>
                    <Link
                      href={item.href}
                      className="-mx-1 inline-flex flex-wrap items-center gap-2 rounded-md px-1 py-2 text-sm text-muted-foreground transition hover:bg-secondary/60 hover:text-foreground sm:py-1.5"
                      onClick={() =>
                        trackEvent("footer_nav_click", {
                          event_category: GA_CATEGORIES.navigation,
                          event_label: item.id,
                          link_href: item.href,
                          section: section.title.toLowerCase(),
                        })
                      }
                    >
                      <span>{item.label}</span>
                      {item.badge ? (
                        <span className="inline-flex items-center rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary theme-dark-only:border-primary/50 theme-dark-only:bg-primary/15">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border/50 pt-4 pb-0 sm:mt-12 sm:pt-5">
          <div className="flex flex-col items-center justify-between gap-2.5 text-center text-xs leading-snug text-muted-foreground sm:flex-row sm:gap-3 sm:text-left sm:text-sm">
            <p className="shrink-0">© {year} Autolokate Software Private Limited.</p>
            <p className="shrink-0">
              Made with <span aria-hidden>❤️</span> in India
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
