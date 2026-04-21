"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { parseCompareSlug } from "@/lib/seo/slugs";
import { resolveCarIdToVariantId } from "@/lib/compare-listing-resolve";

type Props = { slug: string };

/**
 * Legacy URLs: `/compare/car-1-vs-car-2`. Resolves listing ids to catalogue variant ids and opens `/compare?ids=`.
 */
export function CompareLegacySlugRedirect({ slug }: Props) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const ids = parseCompareSlug(slug);
    if (ids.length < 2) {
      router.replace("/compare");
      return;
    }
    (async () => {
      const resolved: string[] = [];
      for (const id of ids) {
        if (cancelled) return;
        if (/^car-\d+$/i.test(id)) {
          const v = await resolveCarIdToVariantId(id);
          if (v) resolved.push(v);
        } else {
          resolved.push(id);
        }
      }
      if (cancelled) return;
      if (resolved.length < 2) {
        setErr("Could not resolve those listings to catalogue variants. Start a new compare from the compare page.");
        return;
      }
      const q = resolved.map((id) => encodeURIComponent(id)).join(",");
      router.replace(`/compare?ids=${q}`);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, router]);

  if (err) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">{err}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
      <p className="text-sm">Updating compare link…</p>
    </div>
  );
}
