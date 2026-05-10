"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight,
  Clock,
  Instagram,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  Send,
  ShieldCheck,
  Sparkles,
  Twitter,
  Users,
  Youtube,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageFade } from "@/components/shared/page-fade";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

const CONTACT_BG_DARK = "/images/contach_bg_dark.png";
const CONTACT_BG_LIGHT = "/images/contact_bg_light.png";

const ROLES = [
  { value: "owner", label: "Vehicle owner" },
  { value: "dealer", label: "Dealer / showroom" },
  { value: "press", label: "Press / Media" },
  { value: "partner", label: "Partner / Reseller" },
  { value: "visitor", label: "Curious visitor" },
];

const SUBJECTS = [
  { value: "general", label: "General enquiry" },
  { value: "support", label: "Account & login support" },
  { value: "bug", label: "Bug report" },
  { value: "feature", label: "Feature request" },
  { value: "partnership", label: "Partnership" },
  { value: "press", label: "Press / Media" },
];

const heroStats: { icon: typeof Clock; label: string; value: string }[] = [
  { icon: Clock, label: "Response Time", value: "Within 24 Hours" },
  { icon: Users, label: "Community", value: "80K+ Users" },
  { icon: ShieldCheck, label: "Support", value: "Always Free" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Inline WhatsApp glyph — lucide doesn't ship one. Sized via parent. */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor"
      className={className}
    >
      <path d="M19.05 4.91A10 10 0 0 0 3.04 17.4L2 22l4.72-1.04A10 10 0 1 0 19.05 4.91Zm-7.06 15.41h-.01a8.32 8.32 0 0 1-4.24-1.16l-.3-.18-2.8.62.62-2.73-.2-.31a8.34 8.34 0 1 1 6.93 3.76Zm4.57-6.24c-.25-.13-1.48-.73-1.71-.81-.23-.09-.4-.13-.57.13-.17.25-.65.81-.8.98-.15.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24a7.65 7.65 0 0 1-1.41-1.76c-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.43.13-.15.17-.25.25-.42.09-.17.04-.32-.02-.45-.06-.13-.57-1.37-.78-1.87-.2-.5-.41-.43-.57-.43h-.49a.94.94 0 0 0-.68.32c-.23.25-.89.87-.89 2.12s.91 2.46 1.04 2.62c.13.17 1.79 2.74 4.34 3.84.61.26 1.08.42 1.45.54.61.19 1.16.16 1.6.1.49-.07 1.48-.6 1.69-1.18.21-.59.21-1.09.15-1.19-.06-.11-.23-.17-.49-.3Z" />
    </svg>
  );
}

const contactCards: {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  label: string;
  primary: string;
  secondary?: string;
  href?: string;
}[] = [
  {
    key: "email",
    icon: Mail,
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-500",
    label: "Email Us",
    primary: "contact@autolokate.com",
    href: "mailto:contact@autolokate.com",
  },
  {
    key: "whatsapp",
    icon: WhatsAppIcon,
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-500",
    label: "WhatsApp Support",
    primary: "+91 906 252 4516",
    href: "https://wa.me/919062524516",
  },
  {
    key: "office",
    icon: MapPin,
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-500",
    label: "Office Location",
    primary: "E 90 / 91 Chanakya Place",
    secondary: "Delhi · 110059",
  },
];

const socials: {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  hoverColor: string;
}[] = [
  { label: "Instagram", href: "#", icon: Instagram, hoverColor: "hover:text-pink-500" },
  { label: "YouTube", href: "#", icon: Youtube, hoverColor: "hover:text-red-500" },
  { label: "LinkedIn", href: "#", icon: Linkedin, hoverColor: "hover:text-sky-600" },
  { label: "Twitter", href: "#", icon: Twitter, hoverColor: "hover:text-sky-400" },
];

const faqs: { q: string; a: string }[] = [
  {
    q: "How do I reset my password?",
    a: "We sign you in with a one-time OTP sent to your phone — no password to remember. If you can't access your number anymore, email contact@autolokate.com from your registered email and we'll help you regain access.",
  },
  {
    q: "Can I use Autolokate offline?",
    a: "Most management features need a connection to sync, but vehicle records and saved emergency contacts remain readable offline once cached on your device.",
  },
  {
    q: "How do I get a QR code for my vehicle?",
    a: "QR is fully optional. You can generate a free digital QR from your dashboard, or order a premium weather-resistant plate. Either works the same way — what's shown on scan is entirely controlled by you.",
  },
  {
    q: "Is my personal data safe?",
    a: "Yes. We follow privacy-first principles: data is encrypted at rest and in transit, sharing is opt-in per feature, and you can delete your data from your account at any time.",
  },
];

export function ContactPageClient() {
  const reduceMotion = useReducedMotion();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setName("");
    setEmail("");
    setRole("");
    setSubject("");
    setMessage("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (trimmedName.length < 2) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!role) {
      toast.error("Please select who you are.");
      return;
    }
    if (!subject) {
      toast.error("Please pick a subject for your message.");
      return;
    }
    if (trimmedMessage.length < 10) {
      toast.error("Please share a bit more (at least 10 characters).");
      return;
    }

    setSubmitting(true);
    try {
      // TODO: wire up to /api/contact when the endpoint is ready.
      await new Promise((r) => setTimeout(r, 700));
      toast.success("Thanks for reaching out! We'll get back to you shortly.", {
        description:
          "Heads up: this form isn't connected yet — we logged your interest in preview mode.",
      });
      resetForm();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageFade>
      <main className="relative">
        {/* ───────────────── Hero ───────────────── */}
        <section className="relative isolate overflow-hidden border-b border-border/70">
          {/* Background image (theme-aware) */}
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
            <Image
              src={CONTACT_BG_DARK}
              alt=""
              fill
              priority
              sizes="100vw"
              className="theme-dark-only object-cover object-[75%_center]"
            />
            <Image
              src={CONTACT_BG_LIGHT}
              alt=""
              fill
              priority
              sizes="100vw"
              className="theme-light-only object-cover object-[75%_center]"
            />

            {/* Left-fading scrim so text stays readable in both themes */}
            <div className="theme-dark-only absolute inset-0 bg-linear-to-r from-zinc-950 via-zinc-950/80 to-zinc-950/10" />
            <div
              className="theme-dark-only absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_15%_30%,rgba(59,130,246,0.18),transparent_60%)]"
              aria-hidden
            />
            <div className="theme-light-only absolute inset-0 bg-linear-to-r from-white via-white/85 to-white/10" />
            <div
              className="theme-light-only absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_15%_30%,rgba(59,130,246,0.10),transparent_60%)]"
              aria-hidden
            />

            {/* Soft fade into the next section */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-b from-transparent to-secondary/40" />
          </div>

          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
              }
              className="max-w-2xl"
            >
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-primary/30",
                  "bg-primary/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-primary backdrop-blur-sm"
                )}
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                24/7 Support Center
              </span>

              <h1 className="font-display mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]">
                How can we
                <br />
                <span className="bg-linear-to-r from-primary via-primary to-sky-400 bg-clip-text text-transparent">
                  help you?
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-[1.05rem]">
                We're here to help — whether you need support, have a question, or want to share
                feedback. Our team is ready to assist you.
              </p>

              <ul className="mt-8 flex flex-wrap gap-3">
                {heroStats.map(({ icon: Icon, label, value }) => (
                  <li
                    key={label}
                    className="group flex items-center gap-3 rounded-full border border-border/70 bg-card/80 px-4 py-2.5 shadow-app-soft backdrop-blur-md transition-colors hover:border-primary/40"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-primary">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="flex flex-col leading-tight">
                      <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {label}
                      </span>
                      <span className="text-[13.5px] font-semibold text-foreground">{value}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </section>

        {/* ───────────────── Form + Sidebar ───────────────── */}
        <section className="relative bg-secondary/40 py-14 sm:py-20">
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
            <div className="theme-dark-only absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_15%,rgba(59,130,246,0.10),transparent_55%)]" />
            <div className="theme-light-only absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_25%_18%,rgba(59,130,246,0.06),transparent_55%)]" />
          </div>

          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-10 lg:px-8">
            {/* Form Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={
                reduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
              }
              className="login-auth-card text-card-foreground"
            >
              <div>
                <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-[1.4rem]">
                  Get in touch
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tell us how we can help. We'll get back to you shortly.
                </p>
              </div>

              <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="contact-name" className="text-sm font-medium text-foreground">
                      Your Name <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="contact-name"
                      type="text"
                      placeholder="John Doe"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 rounded-xl border-border/80 bg-background px-4 text-base shadow-inner"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="contact-email" className="text-sm font-medium text-foreground">
                      Email Address <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="john@example.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 rounded-xl border-border/80 bg-background px-4 text-base shadow-inner"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="contact-role" className="text-sm font-medium text-foreground">
                      I am a <span className="text-primary">*</span>
                    </Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger
                        id="contact-role"
                        className="h-12 rounded-xl border-border/80 bg-background px-4 text-base shadow-inner data-[placeholder]:text-muted-foreground"
                      >
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="contact-subject" className="text-sm font-medium text-foreground">
                      Subject <span className="text-primary">*</span>
                    </Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger
                        id="contact-subject"
                        className="h-12 rounded-xl border-border/80 bg-background px-4 text-base shadow-inner data-[placeholder]:text-muted-foreground"
                      >
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="contact-message" className="text-sm font-medium text-foreground">
                    Your Message <span className="text-primary">*</span>
                  </Label>
                  <Textarea
                    id="contact-message"
                    rows={5}
                    placeholder="How can we help you today?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                    className="min-h-[140px] rounded-xl border-border/80 bg-background px-4 py-3 text-sm shadow-inner"
                    required
                  />
                </div>

                <Button type="submit" size="lg" disabled={submitting} className="w-full">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      <span>Sending message…</span>
                    </>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send className="h-4 w-4" aria-hidden />
                    </>
                  )}
                </Button>

                <p className="text-center text-[11.5px] leading-relaxed text-muted-foreground">
                  By sending this message, you agree to our{" "}
                  <Link
                    href="/privacy"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </form>
            </motion.div>

            {/* Sidebar */}
            <div className="flex flex-col gap-5">
              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }
                }
                className="rounded-3xl border border-border/80 bg-card p-6 shadow-app-soft sm:p-7"
              >
                <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
                  Contact Information
                </h3>

                <ul className="mt-5 space-y-5">
                  {contactCards.map(({ key, icon: Icon, iconBg, iconColor, label, primary, secondary, href }) => (
                    <li key={key} className="flex items-start gap-3.5">
                      <span
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                          iconBg,
                          iconColor
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {label}
                        </p>
                        {href ? (
                          <a
                            href={href}
                            target={href.startsWith("http") ? "_blank" : undefined}
                            rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                            className="mt-0.5 block truncate text-[14px] font-semibold text-foreground transition-colors hover:text-primary"
                          >
                            {primary}
                          </a>
                        ) : (
                          <p className="mt-0.5 text-[14px] font-semibold text-foreground">{primary}</p>
                        )}
                        {secondary ? (
                          <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
                            {secondary}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 border-t border-border/60 pt-5">
                  <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Follow Us
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    {socials.map(({ label, href, icon: Icon, hoverColor }) => (
                      <a
                        key={label}
                        href={href}
                        aria-label={label}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground transition-all",
                          "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
                          hoverColor
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Common Questions */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }
                }
                className="rounded-3xl border border-border/80 bg-card p-6 shadow-app-soft sm:p-7"
              >
                <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
                  Common Questions
                </h3>

                <Accordion type="single" collapsible className="mt-3">
                  {faqs.map((item, i) => (
                    <AccordionItem
                      key={item.q}
                      value={`faq-${i}`}
                      className={cn(
                        "border-b border-border/70",
                        i === faqs.length - 1 && "border-b-0"
                      )}
                    >
                      <AccordionTrigger className="py-3.5 text-[13.5px] font-semibold text-foreground hover:no-underline">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 pt-0 text-[12.5px] leading-relaxed text-muted-foreground">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                <div className="mt-4 border-t border-border/60 pt-4 text-center">
                  <Link
                    href="/about#offers"
                    className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary transition-colors hover:underline"
                  >
                    View all How-To Guides
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
    </PageFade>
  );
}
