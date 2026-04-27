"use client";

import { Badge } from "@/components/ui/badge";
import { type DetailMode } from "@/components/admin/ui/detail-mode";

type Props = {
  mode: DetailMode;
  readOnlyLabel?: string;
};

export function DetailModeBadge({ mode, readOnlyLabel }: Props) {
  if (mode === "edit") {
    return <Badge className="bg-purple-100 text-purple-800">Edit Mode</Badge>;
  }
  return <Badge className="bg-purple-100 text-purple-800">{readOnlyLabel ?? "View Mode"}</Badge>;
}
