"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Gauge } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-secondary/40 px-4 py-12 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-md sm:p-9"
      >
        <Link
          href="/"
          className="flex items-center justify-center gap-2.5 rounded-xl outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Gauge className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">Autolokate</span>
        </Link>
        <p className="mt-6 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Secure access
        </p>
        <h1 className="mt-2 text-center text-2xl font-bold tracking-tight text-foreground sm:text-[1.65rem]">{title}</h1>
        <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </motion.div>
    </div>
  );
}
