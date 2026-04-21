"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
};

export function StepperWrapper({ children, className }: Props) {
  return <div className={cn("flex min-h-0 flex-1 flex-col", className)}>{children}</div>;
}
