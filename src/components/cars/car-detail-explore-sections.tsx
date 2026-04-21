"use client";

import { motion } from "framer-motion";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Gauge,
  History,
  ListChecks,
  MessageSquare,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Wrench,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Car } from "@/data/types";
import { cn } from "@/lib/utils";

const sectionEyebrow =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-primary";
const sectionTitle = "font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl";
const sectionLead = "mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]";

/** Single neutral shell + primary accent only — readable on light surfaces. */
const NAV = [
  { id: "explore-overview", label: "Overview" },
  { id: "explore-specs", label: "Specifications" },
  { id: "explore-features", label: "Features" },
  { id: "explore-history", label: "History" },
  { id: "explore-inspection", label: "Inspection" },
  { id: "explore-reviews", label: "Reviews" },
  { id: "listing-faqs", label: "FAQs" },
] as const;

const sectionShell = "border-border bg-card";
const sectionOrb = "bg-primary/10";
const iconWrap =
  "bg-primary/10 text-primary shadow-inner ring-1 ring-primary/15";

function ExploreSectionShell({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "group relative scroll-mt-28 overflow-hidden rounded-3xl border p-4 shadow-sm transition-shadow duration-300 sm:scroll-mt-36 sm:p-6 md:p-8",
        "hover:shadow-md motion-reduce:transition-none",
        sectionShell,
        className
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl motion-reduce:hidden",
          sectionOrb
        )}
        aria-hidden
      />
      <div className="relative">{children}</div>
    </section>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  lead,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  lead: string;
}) {
  return (
    <>
      <div className="flex flex-wrap items-start gap-3 sm:items-center sm:gap-4">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 motion-reduce:transition-none",
            "group-hover:scale-[1.03]",
            iconWrap
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className={sectionTitle}>{title}</h2>
          <p className={sectionLead}>{lead}</p>
        </div>
      </div>
    </>
  );
}

function SpecCell({ label, value, delay, reduceMotion }: { label: string; value: string; delay: number; reduceMotion: boolean }) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-24px" }}
      transition={{ delay: reduceMotion ? 0 : delay, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <div
        className={cn(
          "group relative h-full overflow-hidden rounded-2xl border border-border/80 bg-card/90 px-4 py-3.5 shadow-sm",
          "transition-all duration-300 ease-out motion-reduce:transition-none",
          "hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md hover:shadow-primary/5",
          "motion-reduce:hover:translate-y-0"
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1.5 break-words text-sm font-semibold leading-snug text-foreground">{value}</p>
      </div>
    </motion.div>
  );
}

export function CarDetailExploreSections({
  car,
  coreSpecs,
  reduceMotion,
}: {
  car: Car;
  coreSpecs: Record<string, string>;
  reduceMotion: boolean;
}) {
  const hasWhyBuy = car.whyBuy?.length > 0;
  const hasPros = car.pros?.length > 0;
  const hasCons = car.cons?.length > 0;
  const specEntries = Object.entries(car.specs ?? {});
  const hasInspection = car.inspectionReport?.length > 0;
  const hasOwnership = car.ownershipTimeline?.length > 0;
  const hasService = car.serviceTimeline?.length > 0;

  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const ids = NAV.map((n) => n.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (top?.target.id) setActiveSection(top.target.id);
      },
      { root: null, rootMargin: "-12% 0px -58% 0px", threshold: [0, 0.08, 0.2, 0.35] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [car.id]);

  return (
    <div className="min-w-0 space-y-8 sm:space-y-10">
      <nav
        className={cn(
          "sticky top-[4.5rem] z-20 flex w-full min-w-0 max-w-full gap-1.5 overflow-x-auto overscroll-x-contain rounded-2xl border border-border bg-card/95 py-2 pl-2 pr-2 shadow-sm backdrop-blur-xl",
          "[-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:px-2 sm:py-2.5 [&::-webkit-scrollbar]:hidden",
          "ring-1 ring-border/60"
        )}
        aria-label="Jump to section"
      >
        {NAV.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={cn(
                "shrink-0 rounded-xl border px-3 py-2 text-xs font-medium text-foreground transition-all duration-200 sm:text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
                "motion-reduce:transition-none",
                isActive
                  ? "border-primary/40 bg-primary/10 font-semibold text-foreground shadow-sm"
                  : "border-transparent bg-muted/70 text-foreground hover:border-border hover:bg-muted hover:shadow-sm"
              )}
            >
              {item.label}
            </a>
          );
        })}
      </nav>

      <ExploreSectionShell id="explore-overview">
        {car.certified ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mb-4 flex flex-wrap items-center gap-2"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 px-3 py-1 text-[11px] font-semibold text-foreground shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Certified listing
            </span>
          </motion.div>
        ) : null}
        <SectionHeading icon={Sparkles} title="Overview" lead="Standouts, pros, and cons from the listing profile." />

        {hasWhyBuy ? (
          <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-5 shadow-inner sm:p-6">
            <p className={sectionEyebrow}>Why this model stands out</p>
            <ul className="mt-4 space-y-3">
              {car.whyBuy.map((line, i) => (
                <motion.li
                  key={i}
                  initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-32px" }}
                  transition={{ delay: reduceMotion ? 0 : i * 0.05, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="flex gap-3 rounded-xl py-1 text-sm leading-relaxed text-foreground transition-colors duration-200 hover:text-foreground"
                >
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {line}
                </motion.li>
              ))}
            </ul>
          </div>
        ) : null}

        {(hasPros || hasCons) && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {hasPros ? (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35 }}
              >
                <Card className="h-full border-border bg-card shadow-sm transition-all duration-300 hover:border-primary/25 hover:shadow-md">
                  <CardContent className="p-5">
                    <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <ThumbsUp className="h-4 w-4 text-primary" aria-hidden />
                      Highlights
                    </p>
                    <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-foreground">
                      {car.pros.map((p, i) => (
                        <li key={i} className="flex gap-2 transition-transform duration-200 hover:translate-x-0.5">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ) : null}
            {hasCons ? (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: reduceMotion ? 0 : 0.06 }}
              >
                <Card className="h-full border-border bg-card shadow-sm transition-all duration-300 hover:border-border hover:shadow-md">
                  <CardContent className="p-5">
                    <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <ThumbsDown className="h-4 w-4 text-muted-foreground" aria-hidden />
                      Things to weigh
                    </p>
                    <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-foreground">
                      {car.cons.map((c, i) => (
                        <li key={i} className="flex gap-2 transition-transform duration-200 hover:translate-x-0.5">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ) : null}
          </div>
        )}
      </ExploreSectionShell>

      <ExploreSectionShell id="explore-specs">
        <SectionHeading icon={Gauge} title="Specifications" lead="Engine, performance, and other figures as listed." />
        <div className="mt-6 space-y-8">
          <div>
            <h3 className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-bold uppercase tracking-wide text-foreground">
              Engine &amp; performance
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(coreSpecs).map(([k, v], i) => (
                <SpecCell key={k} label={k} value={v} delay={reduceMotion ? 0 : i * 0.04} reduceMotion={reduceMotion} />
              ))}
            </div>
          </div>
          {specEntries.length > 0 ? (
            <div>
              <h3 className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-bold uppercase tracking-wide text-foreground">
                Dimensions &amp; listing details
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {specEntries.map(([k, v], i) => (
                  <SpecCell key={k} label={k} value={v} delay={reduceMotion ? 0 : i * 0.03} reduceMotion={reduceMotion} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </ExploreSectionShell>

      <ExploreSectionShell id="explore-features">
        <SectionHeading
          icon={ListChecks}
          title="Features & equipment"
          lead="Equipment and comfort items for this variant."
        />
        <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-4 sm:p-6">
          <div className="flex flex-wrap gap-2">
            {car.features.map((f, i) => (
              <motion.span
                key={f}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ delay: reduceMotion ? 0 : Math.min(i * 0.02, 0.24), duration: 0.25 }}
                className={cn(
                  "inline-flex cursor-default items-center rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-sm",
                  "transition-all duration-200 motion-reduce:transition-none",
                  "hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card hover:shadow-md",
                  "motion-reduce:hover:translate-y-0"
                )}
              >
                {f}
              </motion.span>
            ))}
          </div>
        </div>
      </ExploreSectionShell>

      <ExploreSectionShell id="explore-history">
        <SectionHeading
          icon={History}
          title="Ownership & service history"
          lead="Ownership milestones and service notes from the listing."
        />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-muted/25 p-5 shadow-sm transition-shadow duration-300 hover:shadow-md">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                <History className="h-4 w-4" aria-hidden />
              </span>
              Ownership milestones
            </h3>
            {hasOwnership ? (
              <ul className="mt-4 space-y-4">
                {car.ownershipTimeline.map((ev, i) => (
                  <li
                    key={i}
                    className="relative border-l-2 border-border pl-4 transition-colors duration-200 hover:border-primary/40"
                  >
                    <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-primary shadow-sm ring-2 ring-primary/25" aria-hidden />
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{ev.date}</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">{ev.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{ev.detail}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No ownership timeline entries for this sample listing.</p>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-muted/25 p-5 shadow-sm transition-shadow duration-300 hover:shadow-md">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                <Wrench className="h-4 w-4" aria-hidden />
              </span>
              Service records
            </h3>
            {hasService ? (
              <ul className="mt-4 space-y-3">
                {car.serviceTimeline.map((s, i) => (
                  <li
                    key={i}
                    className={cn(
                      "flex gap-3 rounded-xl border border-border/80 bg-card/95 px-3 py-3 text-sm shadow-sm",
                      "transition-all duration-200 hover:border-primary/25 hover:shadow-md"
                    )}
                  >
                    <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <div>
                      <p className="font-medium text-foreground">{s.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {s.date} · {s.kms.toLocaleString("en-IN")} km
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No service records listed for this sample.</p>
            )}
          </div>
        </div>
      </ExploreSectionShell>

      <ExploreSectionShell id="explore-inspection">
        <SectionHeading
          icon={ClipboardList}
          title="Inspection checklist"
          lead="Category scores from the listing inspection summary."
        />
        {hasInspection ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {car.inspectionReport.map((item, i) => (
              <motion.div
                key={i}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: reduceMotion ? 0 : i * 0.04, duration: 0.28 }}
                className={cn(
                  "flex items-start justify-between gap-3 rounded-2xl border px-4 py-3.5 shadow-sm",
                  "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0",
                  item.status === "pass"
                    ? "border-border bg-card hover:border-primary/25"
                    : "border-border bg-muted/50 hover:border-border"
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{item.category}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.score}/{item.maxScore} points
                  </p>
                </div>
                {item.status === "pass" ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                ) : (
                  <XCircle className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            No inspection breakdown is attached to this listing in the catalog.
          </p>
        )}
      </ExploreSectionShell>

      <ExploreSectionShell id="explore-reviews">
        <SectionHeading
          icon={MessageSquare}
          title="Reviews & ratings"
          lead="Ratings and comments from buyers and viewers."
        />
        <div className="mt-6 space-y-4">
          {car.reviews.length > 0 ? (
            car.reviews.map((r, i) => (
              <motion.div
                key={r.id}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: reduceMotion ? 0 : i * 0.06, duration: 0.32 }}
              >
                <Card className="border-border bg-card shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">{r.author}</p>
                      <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-sm font-semibold tabular-nums text-foreground">
                        ★ {r.rating}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-foreground">{r.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                    <p className="mt-3 text-xs text-muted-foreground">{r.date}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
              No reviews are published for this listing yet.
            </p>
          )}
        </div>
      </ExploreSectionShell>
    </div>
  );
}
