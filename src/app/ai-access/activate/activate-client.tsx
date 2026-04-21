"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { flagAiAccessWelcomeAfterPurchase, writeAiAccess } from "@/lib/client/ai-access-storage";
import { Loader2 } from "lucide-react";

export function AiAccessActivateClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const sessionId = sp.get("session_id")?.trim() ?? "";
  const [msg, setMsg] = useState("Confirming your payment…");

  useEffect(() => {
    if (!sessionId) {
      toast.error("Missing session. Return to a listing and try again.");
      router.replace("/");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/payments/verify-ai-access-session?session_id=${encodeURIComponent(sessionId)}`);
        const data = (await r.json()) as {
          ok?: boolean;
          expiresAt?: string;
          returnUrl?: string;
          error?: string;
        };
        if (cancelled) return;
        if (!r.ok || !data.ok || !data.expiresAt) {
          toast.error(data.error || "Could not confirm payment.");
          router.replace("/");
          return;
        }
        writeAiAccess({
          expiresAt: data.expiresAt,
          provider: "stripe",
          paymentRef: sessionId,
        });
        flagAiAccessWelcomeAfterPurchase();
        toast.success("Autolokate AI is unlocked for 30 days.");
        const next = data.returnUrl?.trim() || "/";
        try {
          const u = new URL(next, window.location.origin);
          if (u.origin === window.location.origin) {
            router.replace(`${u.pathname}${u.search}${u.hash}`);
          } else {
            window.location.href = u.href;
          }
        } catch {
          router.replace("/");
        }
      } catch {
        if (!cancelled) {
          toast.error("Something went wrong. Please contact support if you were charged.");
          router.replace("/");
        }
      } finally {
        if (!cancelled) setMsg("");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
      <p className="text-center text-sm text-muted-foreground">{msg}</p>
    </div>
  );
}
