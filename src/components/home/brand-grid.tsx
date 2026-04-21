"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { brands, cars } from "@/data";
import { carDetailPath } from "@/lib/seo/paths";
import { BrandLogo } from "@/components/brands/brand-logo";

export function BrandGrid() {
  const top = brands.slice(0, 12);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {top.map((b, i) => {
        const sample = cars.find((c) => c.brand === b);
        const href = sample ? carDetailPath(sample) : "/compare";
        return (
          <motion.div
            key={b}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: Math.min(i, 8) * 0.03 }}
          >
            <Link
              href={href}
              className="group flex h-[4.25rem] items-center justify-between gap-2 rounded-2xl border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <BrandLogo brand={b} size={26} />
                <span className="truncate">{b}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-primary opacity-0 transition group-hover:opacity-100" />
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
