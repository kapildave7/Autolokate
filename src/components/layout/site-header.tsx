"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, LogOut, Menu, Search, SquarePen, User, UserPlus, Users } from "lucide-react";
import { motion } from "framer-motion";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { hasAuthTokens } from "@/lib/client/auth-storage";
import { cn } from "@/lib/utils";
import { SmartSearchBar } from "@/components/marketplace/smart-search-bar";
import { GA_CATEGORIES, trackEvent } from "@/lib/analytics";
import { useAuthStore } from "@/stores/auth-store";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const links = [
  { id: "dealers", href: "/companies", label: "Dealers" },
  { id: "media", href: "/media", label: "Media" },
  { id: "stories", href: "/blog", label: "Stories" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [compactSearchOpen, setCompactSearchOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const completeProfile = useAuthStore((s) => s.completeProfile);
  const isBookExpert = pathname === "/book-expert";
  /** Require both persisted session and tokens—avoids avatar when tokens are cleared but store was stale. */
  const isLoggedIn = isAuthenticated && hasAuthTokens();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
    city_id: "",
    budget_min: "",
    budget_max: "",
    preferred_fuel_types: "",
    preferred_body_types: "",
    preferred_vehicle_category: "",
  });
  const avatarLabel = useMemo(() => (user?.full_name || user?.phone || "User").toString(), [user?.full_name, user?.phone]);

  useEffect(() => {
    if (!profileOpen || !user) return;
    setProfileForm({
      full_name: user.full_name ?? "",
      phone: user.phone ?? "",
      city_id: user.city_id ?? "",
      budget_min: user.budget_min != null ? String(user.budget_min) : "",
      budget_max: user.budget_max != null ? String(user.budget_max) : "",
      preferred_fuel_types: Array.isArray(user.preferred_fuel_types) ? user.preferred_fuel_types.join(", ") : "",
      preferred_body_types: Array.isArray(user.preferred_body_types) ? user.preferred_body_types.join(", ") : "",
      preferred_vehicle_category: user.preferred_vehicle_category ?? "",
    });
  }, [profileOpen, user]);

  async function handleLogout(section: string) {
    await logout();
    trackEvent("cta_click", {
      event_category: GA_CATEGORIES.navigation,
      event_label: "logout",
      section,
    });
    router.push("/");
  }

  async function handleProfileSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const payload = {
        full_name: profileForm.full_name.trim() || undefined,
        phone: profileForm.phone.trim() || undefined,
        city_id: profileForm.city_id.trim() || null,
        budget_min: profileForm.budget_min.trim() ? Number(profileForm.budget_min) : null,
        budget_max: profileForm.budget_max.trim() ? Number(profileForm.budget_max) : null,
        preferred_fuel_types: profileForm.preferred_fuel_types.trim()
          ? profileForm.preferred_fuel_types.split(",").map((v) => v.trim()).filter(Boolean)
          : null,
        preferred_body_types: profileForm.preferred_body_types.trim()
          ? profileForm.preferred_body_types.split(",").map((v) => v.trim()).filter(Boolean)
          : null,
        preferred_vehicle_category: profileForm.preferred_vehicle_category.trim() || null,
      };
      await completeProfile(payload);
      toast.success("Profile updated successfully.");
      setProfileOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile.";
      toast.error(message);
    } finally {
      setProfileSaving(false);
    }
  }

  function handleProfileClick(section: string) {
    if (!isLoggedIn) {
      trackEvent("cta_click", { event_category: GA_CATEGORIES.navigation, event_label: "login", section });
      router.push("/login");
      return;
    }
    setProfileOpen(true);
  }

  function AvatarMenu({ theme }: { theme: "dark" | "light" }) {
    const baseClasses =
      theme === "dark"
        ? "rounded-full border border-white/15 bg-linear-to-br from-emerald-500/20 via-teal-500/15 to-cyan-500/20 p-1.5 shadow-[0_10px_30px_-12px_rgba(16,185,129,0.65)] ring-1 ring-emerald-300/20 transition hover:scale-[1.03] focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        : "rounded-full border border-border bg-card p-1.5 shadow-[0_12px_30px_-14px_rgba(0,0,0,0.45)] ring-1 ring-primary/25 transition hover:scale-[1.03] hover:ring-primary/45 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0";
    const iconClasses =
      theme === "dark"
        ? "flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950/70 text-emerald-100"
        : "flex h-7 w-7 items-center justify-center rounded-full bg-background text-foreground";

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={baseClasses} aria-label={avatarLabel}>
            <span className={iconClasses}>
              <User className="h-4 w-4" />
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={10} className="w-52 rounded-2xl border-border/80 bg-card/95 p-2 shadow-xl">
          <DropdownMenuItem className="gap-2.5 rounded-xl px-3 py-2.5 font-medium" onClick={() => handleProfileClick("avatar_profile")}>
            <SquarePen className="h-4 w-4 text-foreground" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2.5 rounded-xl px-3 py-2.5 font-medium"
            onClick={() => {
              trackEvent("cta_click", { event_category: GA_CATEGORIES.navigation, event_label: "join_signup", section: "avatar_menu" });
              router.push("/auth/signup");
            }}
          >
            <UserPlus className="h-4 w-4 text-foreground" />
            Join
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2.5 rounded-xl px-3 py-2.5 font-medium"
            onClick={() => {
              trackEvent("cta_click", { event_category: GA_CATEGORIES.navigation, event_label: "community", section: "avatar_menu" });
              router.push("/community");
            }}
          >
            <Users className="h-4 w-4 text-foreground" />
            Community
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1.5" />
          <DropdownMenuItem className="gap-2.5 rounded-xl px-3 py-2.5 font-medium text-rose-600 focus:text-rose-600" onClick={() => void handleLogout("avatar_logout")}>
            <LogOut className="h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const profileDialog = (
    <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Update your details synced with your account profile.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleProfileSave}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, full_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profileForm.phone}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city_id">City ID</Label>
              <Input
                id="city_id"
                value={profileForm.city_id}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, city_id: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferred_vehicle_category">Vehicle category</Label>
              <Input
                id="preferred_vehicle_category"
                value={profileForm.preferred_vehicle_category}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, preferred_vehicle_category: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget_min">Budget min</Label>
              <Input
                id="budget_min"
                type="number"
                value={profileForm.budget_min}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, budget_min: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget_max">Budget max</Label>
              <Input
                id="budget_max"
                type="number"
                value={profileForm.budget_max}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, budget_max: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="preferred_fuel_types">Preferred fuel types (comma separated)</Label>
              <Input
                id="preferred_fuel_types"
                placeholder="petrol, electric"
                value={profileForm.preferred_fuel_types}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, preferred_fuel_types: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="preferred_body_types">Preferred body types (comma separated)</Label>
              <Input
                id="preferred_body_types"
                placeholder="suv, hatchback"
                value={profileForm.preferred_body_types}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, preferred_body_types: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setProfileOpen(false)} disabled={profileSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={profileSaving}>
              {profileSaving ? "Saving..." : "Save profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  if (isBookExpert) {
    return (
      <>
        <motion.header
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-zinc-950/90 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-2xl backdrop-saturate-150 supports-backdrop-filter:bg-zinc-950/82"
        >
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-emerald-500/35 to-transparent"
          aria-hidden
        />
        <div className="relative mx-auto flex h-13 max-w-6xl items-center justify-between gap-3 px-4 sm:h-14 sm:px-6">
          <Link
            href="/"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/4 py-1.5 pl-2 pr-3.5 text-sm font-medium text-zinc-300 outline-none transition hover:border-emerald-500/25 hover:bg-white/8 hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900/80 text-zinc-400 transition group-hover:bg-emerald-500/15 group-hover:text-emerald-300">
              <ArrowLeft className="h-3.5 w-3.5" />
            </span>
            <span className="hidden sm:inline">Back</span>
          </Link>

          <Link
            href="/"
            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center rounded-xl px-3 py-1 outline-none ring-1 ring-white/10 ring-offset-2 ring-offset-zinc-950 transition hover:ring-emerald-500/30 focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          >
            <Image
              src="https://autolokate.com/autolokate_dark.png"
              alt="Autolokate"
              width={140}
              height={36}
              priority
              className="h-[1.35rem] w-auto opacity-95 sm:h-7"
            />
          </Link>

          <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-zinc-900/60 p-1 pl-1.5 shadow-inner shadow-black/20">
            {/* Chat nav icon hidden for now.
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link
                href="/chat"
                aria-label="Messages"
                onClick={() =>
                  trackEvent("cta_click", {
                    event_category: GA_CATEGORIES.navigation,
                    event_label: "chat",
                    link_href: "/chat",
                    section: "header_book_expert",
                  })
                }
              >
                <MessageCircle className="h-4 w-4" />
              </Link>
            </Button>
            */}
            {isLoggedIn ? (
              <div className="inline-flex">
                <AvatarMenu theme="dark" />
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 shrink-0 border-white/20 bg-white/5 px-3 text-xs font-semibold text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link
                  href="/login"
                  onClick={() =>
                    trackEvent("cta_click", {
                      event_category: GA_CATEGORIES.navigation,
                      event_label: "login",
                      section: "header_book_expert",
                    })
                  }
                >
                  Log in
                </Link>
              </Button>
            )}
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white sm:hidden"
              aria-label="Open menu"
              onClick={() => setOpen((v) => !v)}
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>

        {open ? (
          <div className="relative border-t border-white/8 bg-zinc-950/98 px-4 py-4 backdrop-blur-xl sm:px-6">
            <div className="mx-auto flex max-w-6xl flex-col gap-1">
              {links.map((l) => (
                <Link
                  key={l.id}
                  href={l.href}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/6"
                  onClick={() => {
                    trackEvent("menu_click", {
                      menu: l.id,
                      location: "mobile_book_expert",
                      event_category: GA_CATEGORIES.navigation,
                    });
                    setOpen(false);
                  }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
        </motion.header>
        {profileDialog}
      </>
    );
  }

  return (
    <>
      <motion.header
        initial={{ y: -6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/80 shadow-[0_8px_32px_-12px_rgba(24,24,27,0.08)] backdrop-blur-xl backdrop-saturate-150 supports-backdrop-filter:bg-background/72"
      >
      <div className="mx-auto flex min-h-14 max-w-7xl items-center gap-3 px-5 py-3.5 sm:min-h-16 sm:gap-4 sm:px-8 sm:py-4 lg:px-10">
        <Link href="/" className="flex shrink-0 items-center rounded-lg outline-none ring-offset-background transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2">
          <Image
            src="https://autolokate.com/autolokate_dark.png"
            alt="Autolokate"
            width={140}
            height={36}
            priority
            className="theme-dark-only h-8 w-auto sm:h-9"
          />
          <Image
            src="https://autolokate.com/autolokate_light.png"
            alt="Autolokate"
            width={140}
            height={36}
            priority
            className="theme-light-only h-8 w-auto sm:h-9"
          />
        </Link>

        <div className="hidden min-w-0 flex-1 justify-center px-4 lg:flex">
          <SmartSearchBar className="flex h-10 w-full max-w-2xl items-center gap-2 rounded-full border border-border/80 bg-card/90 pl-4 pr-3 text-left text-sm text-muted-foreground shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-foreground/15 hover:bg-card" />
        </div>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary">
          {links.map((l) => (
            <Link
              key={l.id}
              href={l.href}
              onClick={() =>
                trackEvent("menu_click", {
                  menu: l.id,
                  location: "desktop",
                  event_category: GA_CATEGORIES.navigation,
                })
              }
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-white/8 hover:text-foreground",
                pathname === l.href || pathname.startsWith(l.href + "/")
                  ? "bg-primary/15 text-primary shadow-sm"
                  : ""
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex min-h-10 items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 min-h-11 min-w-11 shrink-0 rounded-lg sm:h-10 sm:w-10 sm:min-h-10 sm:min-w-10 lg:hidden"
            aria-label="Search"
            onClick={() => {
              setCompactSearchOpen((v) => {
                const next = !v;
                if (next) {
                  trackEvent("header_compact_search_toggle", {
                    event_category: GA_CATEGORIES.search,
                    opened: true,
                  });
                }
                return next;
              });
            }}
          >
            <Search className="h-4 w-4" />
          </Button>
          <ThemeToggle />
          {/* Chat nav icon hidden for now.
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 min-h-11 min-w-11 shrink-0 rounded-lg sm:h-10 sm:w-10 sm:min-h-10 sm:min-w-10"
            asChild
          >
            <Link
              href="/chat"
              aria-label="Messages"
              onClick={() =>
                trackEvent("cta_click", {
                  event_category: GA_CATEGORIES.navigation,
                  event_label: "chat",
                  link_href: "/chat",
                })
              }
            >
              <MessageCircle className="h-4 w-4" />
            </Link>
          </Button>
          */}
          {isLoggedIn ? (
            <div className="inline-flex">
              <AvatarMenu theme="light" />
            </div>
          ) : (
            <Button
              size="sm"
              className="h-8 shrink-0 px-3.5 text-xs font-semibold sm:h-9 sm:px-4 sm:text-sm"
              asChild
            >
              <Link
                href="/login"
                onClick={() =>
                  trackEvent("cta_click", {
                    event_category: GA_CATEGORIES.navigation,
                    event_label: "login",
                    section: "header_desktop",
                  })
                }
              >
                Log in
              </Link>
            </Button>
          )}
          <button
            type="button"
            className="inline-flex h-11 w-11 min-h-11 min-w-11 items-center justify-center rounded-lg border border-border/90 bg-card text-muted-foreground shadow-sm transition hover:border-foreground/15 hover:bg-secondary hover:text-foreground sm:h-10 sm:w-10 sm:min-h-10 sm:min-w-10 xl:hidden"
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {compactSearchOpen ? (
        <div className="border-t border-border/70 bg-background/95 px-5 py-4 backdrop-blur-md sm:px-8 lg:hidden">
          <SmartSearchBar className="flex h-10 w-full items-center gap-2 rounded-full border border-border/80 bg-card px-4 text-left text-sm text-muted-foreground shadow-inner" />
        </div>
      ) : null}

      {open ? (
        <div className="border-t border-border/70 bg-background/95 px-5 py-4 backdrop-blur-md sm:px-8 xl:hidden">
          <div className="flex flex-col gap-0.5">
            {links.map((l) => (
              <Link
                key={l.id}
                href={l.href}
                className={cn(
                  "rounded-xl px-4 py-3 text-sm font-medium text-foreground/85 transition hover:bg-white/8 hover:text-foreground",
                  pathname === l.href || pathname.startsWith(l.href + "/")
                    ? "bg-primary/15 text-primary"
                    : ""
                )}
                onClick={() => {
                  trackEvent("menu_click", {
                    menu: l.id,
                    location: "mobile",
                    event_category: GA_CATEGORIES.navigation,
                  });
                  setOpen(false);
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      </motion.header>
      {profileDialog}
    </>
  );
}
