"use client";

import { Toaster } from "sonner";
import { useEffect } from "react";
import { QueryProvider } from "@/providers/query-provider";
import { hasAuthTokens } from "@/lib/client/auth-storage";
import { useAuthStore } from "@/stores/auth-store";

function AuthBootstrap() {
  const hydrateProfile = useAuthStore((s) => s.hydrateProfile);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated && !hasAuthTokens()) return;
    void hydrateProfile();
  }, [hydrateProfile, isAuthenticated]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthBootstrap />
      {children}
      <Toaster richColors position="top-center" theme="light" closeButton />
    </QueryProvider>
  );
}
