"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Loader2 } from "lucide-react";
import { hasAuthTokens } from "@/lib/client/auth-storage";
import { usePreferenceFinderStore } from "@/stores/preference-finder-store";

/**
 * Full-screen loader while the preference finder bootstraps (logged-in users only).
 * Hides when `ready` is true and `bootstrapping` is false so matches / wizard state are consistent.
 */
export function DiscoveryHomeBootstrapLoader() {
  const loggedIn = useSyncExternalStore(
    () => () => {},
    () => hasAuthTokens(),
    () => false
  );
  const ready = usePreferenceFinderStore((s) => s.ready);
  const bootstrapping = usePreferenceFinderStore((s) => s.bootstrapping);

  const show = loggedIn && (!ready || bootstrapping);

  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [show]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background/95 backdrop-blur-sm"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading"
    >
      <Loader2 className="h-9 w-9 animate-spin text-foreground" aria-hidden />
      <p className="max-w-xs text-center text-sm font-medium text-muted-foreground">
        Loading your preferences and matches…
      </p>
    </div>
  );
}
