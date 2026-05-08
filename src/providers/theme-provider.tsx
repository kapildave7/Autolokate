"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  /** What the user selected (incl. "system"). */
  theme: ThemeChoice;
  /** What is actually applied right now ("light" | "dark"). */
  resolvedTheme: ResolvedTheme;
  setTheme: (next: ThemeChoice) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = "autolokate.theme";
const DEFAULT_THEME: ThemeChoice = "dark";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): ThemeChoice {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    // ignore (private mode / disabled storage)
  }
  return DEFAULT_THEME;
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolve(choice: ThemeChoice): ResolvedTheme {
  if (choice === "system") return systemPrefersDark() ? "dark" : "light";
  return choice;
}

function applyTheme(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>(DEFAULT_THEME);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");

  // First mount: load stored choice + resolve.
  useEffect(() => {
    const stored = readStoredTheme();
    const resolved = resolve(stored);
    setThemeState(stored);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  // When choice = "system", react to OS theme changes.
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const resolved: ResolvedTheme = media.matches ? "dark" : "light";
      setResolvedTheme(resolved);
      applyTheme(resolved);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: ThemeChoice) => {
    setThemeState(next);
    const resolved = resolve(next);
    setResolvedTheme(resolved);
    applyTheme(resolved);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>.");
  }
  return ctx;
}

/**
 * Pre-paint script. Renders synchronously inside <head> so the correct
 * `data-theme` is on <html> before the body paints — no flash.
 *
 * Defaults to dark to match SSR (`:root` tokens are dark) when no preference
 * is stored. The "system" choice resolves via prefers-color-scheme.
 */
export const themeBootstrapScript = `
(function () {
  try {
    var d = document.documentElement;
    var stored = null;
    try { stored = window.localStorage.getItem('${STORAGE_KEY}'); } catch (_) {}
    var choice = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : '${DEFAULT_THEME}';
    var resolved = choice;
    if (choice === 'system') {
      resolved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    d.dataset.theme = resolved;
    d.style.colorScheme = resolved;
  } catch (_) {}
})();
`;
