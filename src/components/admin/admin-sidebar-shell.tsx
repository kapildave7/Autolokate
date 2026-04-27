"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  LogOut,
  Star,
  Users,
  Wallet,
  ReceiptIndianRupee,
  CalendarCheck2,
  Bot,
  ShieldAlert,
  GitBranch,
  Car,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/models", label: "Models & Cars", icon: Car },
  { href: "/admin/catalogue", label: "Catalogue", icon: ListChecks },
  { href: "/admin/pricing", label: "Pricing", icon: Wallet },
  { href: "/admin/payments", label: "Payments", icon: ReceiptIndianRupee },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck2 },
  { href: "/admin/scraper", label: "Scraper", icon: Bot },
  { href: "/admin/support", label: "Support", icon: ShieldAlert },
  { href: "/admin/pipeline", label: "Pipeline", icon: GitBranch },
];

export function AdminSidebarShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const isLoginPage = pathname === "/admin";
  if (isLoginPage) return <>{children}</>;

  async function onLogout() {
    await logout();
    router.replace("/admin");
  }

  return (
    <div className="flex min-h-screen bg-[#f6f3ff] text-zinc-900">
      <aside className="hidden w-64 shrink-0 border-r border-purple-100 bg-white p-4 lg:block">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-purple-700">Autolokate Admin</p>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-purple-700 text-white" : "text-purple-700 hover:bg-purple-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Button variant="outline" className="mt-6 w-full border-purple-200" onClick={() => void onLogout()}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
