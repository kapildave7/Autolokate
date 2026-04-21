"use client";

import type { ReactNode } from "react";

type Props = { children: ReactNode };

export function StepContent({ children }: Props) {
  return <div className="min-h-0 flex-1 space-y-6">{children}</div>;
}
