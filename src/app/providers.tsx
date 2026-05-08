"use client";

import { Toaster } from "sonner";
import { useEffect } from "react";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider, useTheme } from "@/providers/theme-provider";
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

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster richColors position="top-center" theme={resolvedTheme} closeButton />;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthBootstrap />
        {children}
        <ThemedToaster />
      </QueryProvider>
    </ThemeProvider>
  );
}
