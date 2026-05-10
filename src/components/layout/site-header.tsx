"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Car,
  Fuel,
  IndianRupee,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  Phone,
  Search,
  SquarePen,
  User,
  Users,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hasAuthTokens } from "@/lib/client/auth-storage";
import {
  MAX_CITY_ID,
  MAX_NAME,
  validateProfileForm,
  VEHICLE_CATEGORIES,
  type ProfileFieldKey,
} from "@/lib/profile-form-validation";
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

const profileFieldInputClass =
  "h-11 rounded-full border border-border/60 bg-muted/35 px-4 text-[0.9375rem] shadow-inner transition-[box-shadow,border-color] placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-0 sm:h-11 sm:text-[0.9375rem]";

const profileLabelClass = "text-sm font-semibold tracking-tight text-foreground";

const profileSelectTriggerClass =
  "h-11 w-full rounded-full border border-border/60 bg-muted/35 px-4 text-left text-[0.9375rem] shadow-inner focus:ring-2 focus:ring-ring/35 focus:ring-offset-0 focus-visible:ring-primary/40";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [compactSearchOpen, setCompactSearchOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const completeProfile = useAuthStore((s) => s.completeProfile);
  /** Require both persisted session and tokens—avoids avatar when tokens are cleared but store was stale. */
  const isLoggedIn = isAuthenticated && hasAuthTokens();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Partial<Record<ProfileFieldKey, string>>>({});
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
    setProfileErrors({});
    setProfileForm({
      full_name: user.full_name ?? "",
      phone: user.phone ?? "",
      city_id: user.city_id ?? "",
      budget_min: user.budget_min != null ? String(user.budget_min) : "",
      budget_max: user.budget_max != null ? String(user.budget_max) : "",
      preferred_fuel_types: Array.isArray(user.preferred_fuel_types) ? user.preferred_fuel_types.join(", ") : "",
      preferred_body_types: Array.isArray(user.preferred_body_types) ? user.preferred_body_types.join(", ") : "",
      preferred_vehicle_category: (() => {
        const raw = user.preferred_vehicle_category?.trim().toLowerCase() ?? "";
        return VEHICLE_CATEGORIES.includes(raw as (typeof VEHICLE_CATEGORIES)[number]) ? raw : "";
      })(),
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

  function clearProfileError(key: ProfileFieldKey) {
    setProfileErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleProfileSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const checked = validateProfileForm(profileForm);
    if (!checked.ok) {
      setProfileErrors(checked.errors);
      const first = Object.values(checked.errors)[0];
      toast.error(first ?? "Check the highlighted fields.");
      return;
    }
    setProfileErrors({});

    const phoneCompact = profileForm.phone.trim().replace(/\s/g, "");
    const minRaw = profileForm.budget_min.trim();
    const maxRaw = profileForm.budget_max.trim();

    setProfileSaving(true);
    try {
      const payload = {
        full_name: profileForm.full_name.trim() || undefined,
        phone: phoneCompact || undefined,
        city_id: profileForm.city_id.trim() || null,
        budget_min: minRaw ? Number(minRaw) : null,
        budget_max: maxRaw ? Number(maxRaw) : null,
        preferred_fuel_types: checked.fuelPayload,
        preferred_body_types: checked.bodyPayload,
        preferred_vehicle_category: profileForm.preferred_vehicle_category.trim().toLowerCase() || null,
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
      <DialogContent
        className={cn(
          "flex w-[calc(100%-0.75rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:w-full",
          "max-h-[min(calc(100dvh-0.75rem),100vh)] sm:max-h-[min(88dvh,92vh)]",
          "border-border/80 bg-card/98 ring-1 ring-primary/[0.14] shadow-premium sm:max-w-[28rem] sm:rounded-[1.35rem]"
        )}
      >
        <div className="relative shrink-0 overflow-hidden border-b border-border/60 bg-linear-to-br from-primary/[0.07] via-card to-card px-3.5 pb-3 pr-12 pt-2 sm:px-4 sm:pb-3.5 sm:pr-12 sm:pt-2.5">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.55] bg-[radial-gradient(ellipse_120%_80%_at_88%_-20%,rgba(37,99,235,0.18),transparent_50%)]"
            aria-hidden
          />
          <DialogHeader className="relative gap-2 space-y-0 text-left sm:text-left">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-inner sm:h-10 sm:w-10">
                <SquarePen className="h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]" aria-hidden />
              </span>
              <div className="min-w-0 space-y-1">
                <DialogTitle className="font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
                  Edit profile
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed text-muted-foreground sm:text-sm">
                  Update your details synced with your account profile.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleProfileSave}>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 py-3.5 sm:px-4 sm:py-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/55 pb-2">
                <User className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Account</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="full_name" className={profileLabelClass}>
                    Full name
                  </Label>
                  <Input
                    id="full_name"
                    autoComplete="name"
                    maxLength={MAX_NAME}
                    placeholder="e.g. Rahul Sharma"
                    aria-invalid={Boolean(profileErrors.full_name)}
                    className={cn(profileFieldInputClass, profileErrors.full_name && "border-destructive focus-visible:ring-destructive/35")}
                    value={profileForm.full_name}
                    onChange={(e) => {
                      clearProfileError("full_name");
                      setProfileForm((prev) => ({ ...prev, full_name: e.target.value }));
                    }}
                  />
                  {profileErrors.full_name ? (
                    <p className="text-xs text-destructive">{profileErrors.full_name}</p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="phone" className={profileLabelClass}>
                    Phone
                  </Label>
                  <div className="relative">
                    <Phone
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      maxLength={22}
                      placeholder="e.g. +91 88765 43210"
                      aria-invalid={Boolean(profileErrors.phone)}
                      className={cn(profileFieldInputClass, "pl-11", profileErrors.phone && "border-destructive focus-visible:ring-destructive/35")}
                      value={profileForm.phone}
                      onChange={(e) => {
                        clearProfileError("phone");
                        setProfileForm((prev) => ({ ...prev, phone: e.target.value }));
                      }}
                    />
                  </div>
                  {profileErrors.phone ? <p className="text-xs text-destructive">{profileErrors.phone}</p> : null}
                </div>
              </div>
            </div>

            <Separator className="bg-border/70" />

            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/55 pb-2">
                <Car className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary pt-4 pb-2">Driving preferences</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="city_id" className={profileLabelClass}>
                    City ID
                  </Label>
                  <div className="relative">
                    <MapPin
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      id="city_id"
                      maxLength={MAX_CITY_ID}
                      placeholder="Catalogue ref"
                      aria-invalid={Boolean(profileErrors.city_id)}
                      className={cn(profileFieldInputClass, "pl-11", profileErrors.city_id && "border-destructive focus-visible:ring-destructive/35")}
                      value={profileForm.city_id}
                      onChange={(e) => {
                        clearProfileError("city_id");
                        setProfileForm((prev) => ({ ...prev, city_id: e.target.value }));
                      }}
                    />
                  </div>
                  {profileErrors.city_id ? (
                    <p className="text-xs text-destructive">{profileErrors.city_id}</p>
                  ) : (
                    <p className="text-xs leading-snug text-muted-foreground">
                      Matches your marketplace city identifier when set.
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="preferred_vehicle_category" className={profileLabelClass}>
                    Vehicle category
                  </Label>
                  <Select
                    value={profileForm.preferred_vehicle_category || "__none__"}
                    onValueChange={(v) => {
                      clearProfileError("preferred_vehicle_category");
                      setProfileForm((p) => ({ ...p, preferred_vehicle_category: v === "__none__" ? "" : v }));
                    }}
                  >
                    <SelectTrigger
                      id="preferred_vehicle_category"
                      aria-invalid={Boolean(profileErrors.preferred_vehicle_category)}
                      className={cn(
                        profileSelectTriggerClass,
                        profileErrors.preferred_vehicle_category && "border-destructive focus-visible:ring-destructive/35"
                      )}
                    >
                      <SelectValue placeholder="Not specified" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Not specified</SelectItem>
                      {VEHICLE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c} className="capitalize">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {profileErrors.preferred_vehicle_category ? (
                    <p className="text-xs text-destructive">{profileErrors.preferred_vehicle_category}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground"></p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="budget_min" className={profileLabelClass}>
                    Budget min (₹)
                  </Label>
                  <div className="relative">
                    <IndianRupee
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      id="budget_min"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Minimum"
                      aria-invalid={Boolean(profileErrors.budget_min)}
                      className={cn(profileFieldInputClass, "pl-11", profileErrors.budget_min && "border-destructive focus-visible:ring-destructive/35")}
                      value={profileForm.budget_min}
                      onChange={(e) => {
                        clearProfileError("budget_min");
                        setProfileForm((prev) => ({
                          ...prev,
                          budget_min: e.target.value.replace(/\D/g, ""),
                        }));
                      }}
                    />
                  </div>
                  {profileErrors.budget_min ? <p className="text-xs text-destructive">{profileErrors.budget_min}</p> : null}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="budget_max" className={profileLabelClass}>
                    Budget max (₹)
                  </Label>
                  <div className="relative">
                    <IndianRupee
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      id="budget_max"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Maximum"
                      aria-invalid={Boolean(profileErrors.budget_max)}
                      className={cn(profileFieldInputClass, "pl-11", profileErrors.budget_max && "border-destructive focus-visible:ring-destructive/35")}
                      value={profileForm.budget_max}
                      onChange={(e) => {
                        clearProfileError("budget_max");
                        setProfileForm((prev) => ({
                          ...prev,
                          budget_max: e.target.value.replace(/\D/g, ""),
                        }));
                      }}
                    />
                  </div>
                  {profileErrors.budget_max ? <p className="text-xs text-destructive">{profileErrors.budget_max}</p> : null}
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="preferred_fuel_types" className={profileLabelClass}>
                    Preferred fuels
                  </Label>
                  <div className="relative">
                    <Fuel
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      id="preferred_fuel_types"
                      placeholder="Eg:- Petrol, Electric, Diesel, Hybrid, CNG"
                      aria-invalid={Boolean(profileErrors.preferred_fuel_types)}
                      className={cn(
                        profileFieldInputClass,
                        "pl-11",
                        profileErrors.preferred_fuel_types && "border-destructive focus-visible:ring-destructive/35"
                      )}
                      value={profileForm.preferred_fuel_types}
                      onChange={(e) => {
                        clearProfileError("preferred_fuel_types");
                        setProfileForm((prev) => ({ ...prev, preferred_fuel_types: e.target.value }));
                      }}
                    />
                  </div>
                  {profileErrors.preferred_fuel_types ? (
                    <p className="text-xs text-destructive">{profileErrors.preferred_fuel_types}</p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="preferred_body_types" className={profileLabelClass}>
                    Preferred body styles
                  </Label>
                  <Input
                    id="preferred_body_types"
                    placeholder="Eg:- SUV, Hatchback"
                    aria-invalid={Boolean(profileErrors.preferred_body_types)}
                    className={cn(
                      profileFieldInputClass,
                      profileErrors.preferred_body_types && "border-destructive focus-visible:ring-destructive/35"
                    )}
                    value={profileForm.preferred_body_types}
                    onChange={(e) => {
                      clearProfileError("preferred_body_types");
                      setProfileForm((prev) => ({ ...prev, preferred_body_types: e.target.value }));
                    }}
                  />
                  {profileErrors.preferred_body_types ? (
                    <p className="text-xs text-destructive">{profileErrors.preferred_body_types}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-border/60 bg-muted/25 px-3.5 py-3 sm:justify-end sm:gap-2.5 sm:px-4 sm:py-3.5">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-border/80 bg-background shadow-sm hover:bg-accent/80"
              onClick={() => setProfileOpen(false)}
              disabled={profileSaving}
            >
              Cancel
            </Button>
            <Button type="submit" className="h-11 rounded-xl px-6 text-base font-semibold shadow-md" disabled={profileSaving}>
              {profileSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                "Save profile"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

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
