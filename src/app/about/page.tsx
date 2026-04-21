import type { Metadata } from "next";
import { Layers, ShieldCheck, Sparkles } from "lucide-react";
import { CustomerPageShell } from "@/components/shared/customer-page-shell";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About Autolokate",
  description: "Premium automotive research platform — compare, test drive, and connect with dealers.",
};

const pillars = [
  {
    icon: ShieldCheck,
    title: "Trust-first layout",
    body: "Specs, reference pricing, and media are presented in a calm hierarchy so you compare without guesswork.",
  },
  {
    icon: Layers,
    title: "Modular by design",
    body: "Compare, media, and dealer tools share one design system — easy to extend when you wire a real API.",
  },
  {
    icon: Sparkles,
    title: "Polished experience",
    body: "Subtle motion and generous spacing — tuned for long research sessions on phone and desktop.",
  },
] as const;

export default function AboutPage() {
  return (
    <CustomerPageShell
      eyebrow="About us"
      title="Research-first, not checkout-first"
      lead="Autolokate is a design-led decision platform: comparisons, expert media, and dealer conversations — ready for your data layer when you are."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {pillars.map(({ icon: Icon, title, body }) => (
          <Card
            key={title}
            className="transition-shadow duration-200 hover:shadow-md"
          >
            <CardContent className="p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="friendly-prose mt-14 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <p>
          This build uses sample catalog data in{" "}
          <code className="rounded-md bg-secondary px-1.5 py-0.5 text-xs text-primary">src/data</code>.
          Swap in API adapters, add auth guards on dashboards, and connect your CRM when your backend is ready —
          the UI is structured to stay stable as you grow.
        </p>
      </div>
    </CustomerPageShell>
  );
}
