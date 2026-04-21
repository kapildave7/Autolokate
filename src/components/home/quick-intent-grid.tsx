import Link from "next/link";
import { CarFront, GitCompare, Newspaper, Bike } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const items = [
  {
    href: "/cars",
    title: "Browse cars",
    desc: "See models, colors, specs, and prices in one place.",
    icon: CarFront,
  },
  {
    href: "/bikes",
    title: "Browse bikes",
    desc: "Explore motorcycles and scooters with quick filters.",
    icon: Bike,
  },
  {
    href: "/compare",
    title: "Compare models",
    desc: "Understand differences side by side before shortlisting.",
    icon: GitCompare,
  },
  {
    href: "/media",
    title: "Watch and read",
    desc: "Editorial stories, reviews, videos, and explainers.",
    icon: Newspaper,
  },
];

export function QuickIntentGrid() {
  return (
    <section className="border-b border-border bg-white py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} href={item.href}>
                <Card className="lift-hover h-full border-border bg-card">
                  <CardContent className="p-5">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-base font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
