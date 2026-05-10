"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Car,
  CheckCircle2,
  Download,
  Lock,
  MessageCircle,
  Phone,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PageFade } from "@/components/shared/page-fade";
import { SITE_NAME } from "@/lib/seo/site";
import { cn } from "@/lib/utils";

type Feature = {
  icon: typeof Car;
  title: string;
  body: string;
};

const features: Feature[] = [
  {
    icon: Car,
    title: "Vehicle Management",
    body: "Track vehicle records, service history, and important documents from one calm dashboard.",
  },
  {
    icon: Users,
    title: "Community Support",
    body: "Connect with other vehicle owners through our opt-in community for advice and shared trips.",
  },
  {
    icon: Wallet,
    title: "Trip & Expense Sharing",
    body: "Share trips and expenses with friends, split fuel and tolls, and keep group travel fair.",
  },
  {
    icon: Phone,
    title: "Emergency Contacts",
    body: "Add trusted contacts who can be notified quickly when your vehicle needs assistance.",
  },
  {
    icon: QrCode,
    title: "Optional QR Codes",
    body: "QR codes are optional and add only what you decide. Never required, always under your control.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy First",
    body: "All data stays opt-in. You control what's shared, when, and with whom — no shortcuts.",
  },
];

const philosophy = [
  {
    title: "Free core safety features for everyone.",
    body: "We believe essential safety tools should be accessible to all, not locked behind paywalls.",
  },
  {
    title: "QR is optional, not forced.",
    body: "Our platform works perfectly without QR codes. They're an enhancement, not a requirement.",
  },
  {
    title: "Vehicle-first identity.",
    body: "We organize around your vehicle, making it easier to manage multiple cars and their needs.",
  },
  {
    title: "Privacy-first design.",
    body: "All features are opt-in. You control what information is shared, when, and with whom.",
  },
];

const importantInfo = [
  {
    title: "Autolokate does not replace emergency services.",
    body: "In any emergency situation, always contact official emergency services (police, ambulance, fire department) first. Autolokate is a complement that helps notify your trusted contacts.",
  },
  {
    title: "No government integration.",
    body: "Autolokate is not affiliated with, endorsed by, or integrated with any government agency, RTO, or official vehicle registration system. All information shown is owner-provided and voluntary.",
  },
  {
    title: "User responsibility.",
    body: "Users are responsible for the accuracy of information they provide and for maintaining their emergency contacts. Autolokate enables communication but does not guarantee the safety of emergency response.",
  },
  {
    title: "Privacy and consent.",
    body: "All features require explicit user consent. Emergency contacts must accept requests. Visibility settings are controlled per vehicle. You can disable features at any time.",
  },
];

const faqs = {
  left: [
    {
      q: "What is Autolokate?",
      a: "Autolokate is a free, privacy-first platform that helps vehicle owners manage their vehicles, share trips and expenses, and stay prepared for emergencies — without giving up control of their data.",
    },
    {
      q: "Is Autolokate free to use?",
      a: "Yes. The core safety and vehicle management features are free for everyone. Optional add-ons like premium QR plates may carry a small one-time cost, but you never need them to use the platform.",
    },
    {
      q: "How does the emergency contact system work?",
      a: "You add trusted contacts who must accept the invitation. If you're in an incident, your contacts can be notified through the channels you've enabled. We never call emergency services on your behalf.",
    },
    {
      q: "What information is shown when someone scans my license plate?",
      a: "Only the fields you've explicitly chosen to share — typically a way to reach you or your contact. Personal data like home address or documents are never shown by default.",
    },
  ],
  right: [
    {
      q: "Do I need a QR code to use Autolokate?",
      a: "No. QR codes are entirely optional. You can use vehicle management, trip sharing, and emergency contacts without ever printing or attaching a QR code.",
    },
    {
      q: "Is my data safe and private?",
      a: "Yes. We follow privacy-first principles: data is encrypted at rest and in transit, sharing is opt-in per feature, and you can delete your data from your account at any time.",
    },
    {
      q: "Does Autolokate replace emergency services?",
      a: "No. Autolokate is never a substitute for the police, ambulance, or fire services. Always contact official emergency services first; we can help you notify trusted people in parallel.",
    },
    {
      q: "Can I use Autolokate offline?",
      a: "Most management features require a connection to sync, but vehicle records and saved contacts remain readable offline once cached on your device.",
    },
  ],
};

const heroPillars: {
  icon: typeof ShieldCheck;
  label: string;
  caption: string;
}[] = [
  { icon: ShieldCheck, label: "Privacy", caption: "Opt-in by default, always" },
  { icon: Car, label: "Vehicle", caption: "Records, expenses, history" },
  { icon: Users, label: "Community", caption: "Trips and trusted circles" },
  { icon: Phone, label: "Emergency", caption: "Notify the people who matter" },
];

const sectionTitle =
  "font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl";

export function AboutPageClient() {
  return (
    <PageFade>
      <main className="relative">
        {/* ───────────────── Hero ───────────────── */}
        <section className="relative isolate overflow-hidden border-b border-border/70 bg-background">
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
            <Image
              src="/images/home_banner_light.png"
              alt=""
              fill
              priority
              sizes="100vw"
              className="theme-light-only object-cover object-[70%_center] opacity-[0.55]"
            />
            <Image
              src="/images/home_banner_dark.png"
              alt=""
              fill
              priority
              sizes="100vw"
              className="theme-dark-only object-cover object-[70%_center] opacity-70"
            />
            <div className="absolute inset-0 bg-linear-to-r from-background via-background/85 to-background/30 dark:from-background dark:via-background/80 dark:to-transparent" />
            <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-background to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background to-transparent" />
          </div>

          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="max-w-2xl">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border border-primary/30",
                    "bg-primary/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-primary"
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  About {SITE_NAME}
                </span>

                <h1 className="font-display mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]">
                  Building a Safer
                  <br />
                  <span className="bg-linear-to-r from-primary via-primary to-sky-500 bg-clip-text text-transparent">
                    Vehicle Community
                  </span>
                </h1>

                <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-[1.05rem]">
                  {SITE_NAME} is a free platform that helps vehicle owners manage their vehicles,
                  connect with others, and stay prepared for emergencies — all while keeping
                  complete control over your privacy.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
                  <Button size="lg" asChild>
                    <Link href="#offers">
                      Explore features
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/contact">Contact us</Link>
                  </Button>
                </div>
              </div>

              {/* Pillars — connected timeline stack */}
              <div className="relative hidden w-[19rem] lg:block">
                {/* Vertical glowing connector line */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute bottom-6 left-[1.625rem] top-6 w-px bg-linear-to-b from-transparent via-primary/40 to-transparent"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-[1.4375rem] top-3 h-2 w-2 rounded-full bg-primary shadow-[0_0_18px_4px_rgba(37,99,235,0.55)]"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute bottom-3 left-[1.4375rem] h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_18px_4px_rgba(14,165,233,0.5)]"
                />

                <ol className="relative flex flex-col gap-3.5">
                  {heroPillars.map(({ icon: Icon, label, caption }, i) => {
                    const step = String(i + 1).padStart(2, "0");
                    return (
                      <li
                        key={label}
                        className="group relative flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card/85 px-3 py-3 shadow-app-soft backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-card hover:shadow-md"
                      >
                        {/* Step badge — sits on the connector line */}
                        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-4 ring-background transition-colors group-hover:bg-primary/18">
                          <Icon className="h-4 w-4" aria-hidden />
                          <span className="absolute -bottom-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground shadow-sm">
                            {step}
                          </span>
                        </span>

                        <div className="min-w-0">
                          <p className="text-[13.5px] font-semibold leading-tight text-foreground">
                            {label}
                          </p>
                          <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
                            {caption}
                          </p>
                        </div>

                        <ArrowRight
                          className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground/60 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary group-hover:opacity-100"
                          aria-hidden
                        />
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────── Why + Offers ───────────────── */}
        <section id="offers" className="bg-muted/30 py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-10 lg:px-8">
            <div className="rounded-3xl border border-border/80 bg-card p-7 shadow-app-soft sm:p-8">
              <span className="block h-1 w-10 rounded-full bg-primary" aria-hidden />
              <h2 className={cn(sectionTitle, "mt-4")}>Why {SITE_NAME}?</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
                Vehicle ownership comes with challenges: keeping track of service records, managing
                expenses, coordinating trips, and ensuring someone can step in during an emergency.
                {" "}{SITE_NAME} addresses these challenges with a calm, owner-first toolkit.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
                We put owners first, not user profiles. The platform combines vehicle management,
                community support, trip &amp; expense sharing, and optional emergency contact
                features — all in one privacy-conscious place. Free, simple, and designed to help
                when you need it.
              </p>
            </div>

            <div>
              <h3 className={sectionTitle}>What {SITE_NAME} Offers</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Six focused modules — opt into the ones that fit your routine.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {features.map(({ icon: Icon, title, body }) => (
                  <div
                    key={title}
                    className="group rounded-2xl border border-border/80 bg-card p-5 shadow-app-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h4 className="mt-4 text-sm font-semibold text-foreground">{title}</h4>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                      {body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────── Philosophy + Important Info ───────────────── */}
        <section className="bg-background py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8">
            <div className="rounded-3xl border border-border/80 bg-card p-7 shadow-app-soft sm:p-8">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Lock className="h-4 w-4" aria-hidden />
                </span>
                <h2 className={sectionTitle}>Our Philosophy</h2>
              </div>
              <ul className="mt-6 space-y-5">
                {philosophy.map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                      aria-hidden
                    />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-amber-500/30 bg-amber-50/60 p-7 shadow-app-soft dark:border-amber-400/20 dark:bg-amber-500/5 sm:p-8">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" aria-hidden />
                </span>
                <h2 className={sectionTitle}>Important Information</h2>
              </div>
              <ul className="mt-6 space-y-5">
                {importantInfo.map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400"
                      aria-hidden
                    />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ───────────────── FAQ ───────────────── */}
        <section className="bg-muted/30 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className={cn(sectionTitle, "text-center")}>Frequently Asked Questions</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Common questions about {SITE_NAME}.
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-2 lg:gap-6">
              {[faqs.left, faqs.right].map((column, idx) => (
                <Accordion
                  key={idx}
                  type="single"
                  collapsible
                  className="rounded-2xl border border-border/80 bg-card px-5 shadow-app-soft sm:px-6"
                >
                  {column.map((item, i) => (
                    <AccordionItem
                      key={item.q}
                      value={`faq-${idx}-${i}`}
                      className={cn(
                        "border-b border-border/70",
                        i === column.length - 1 && "border-b-0"
                      )}
                    >
                      <AccordionTrigger className="text-sm font-semibold text-foreground sm:text-[15px]">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-[13px] leading-relaxed text-muted-foreground">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────────── CTA Banner ───────────────── */}
        <section className="bg-background pb-20 pt-6 sm:pb-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-primary to-sky-600 p-8 shadow-[0_24px_60px_-24px_rgba(37,99,235,0.6)] sm:p-10">
              <div
                className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-20"
                aria-hidden
              >
                <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/30 blur-3xl" />
                <div className="absolute -bottom-12 right-10 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
              </div>

              <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <span className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm sm:flex">
                    <ShieldCheck className="h-6 w-6" aria-hidden />
                  </span>
                  <div>
                    <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      Ready to Get Started?
                    </h2>
                    <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/85 sm:text-[15px]">
                      Join thousands of vehicle owners already using {SITE_NAME} to manage their
                      vehicles and stay connected.
                    </p>
                  </div>
                </div>

                <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                  <Button
                    size="lg"
                    className="border border-transparent bg-white text-primary shadow-md hover:bg-white/90 hover:text-primary"
                    asChild
                  >
                    <Link href="/download">
                      <Download className="h-4 w-4" aria-hidden />
                      Download App
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/40 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white"
                    asChild
                  >
                    <Link href="/contact">
                      <MessageCircle className="h-4 w-4" aria-hidden />
                      Contact Us
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PageFade>
  );
}
