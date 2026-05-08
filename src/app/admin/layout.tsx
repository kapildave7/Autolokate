import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/seo/site";
import { AdminSidebarShell } from "@/components/admin/admin-sidebar-shell";

export const metadata: Metadata = {
  title: `Admin — ${SITE_NAME}`,
  description: `Admin dashboard for ${SITE_NAME}`,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-scope">
      <AdminSidebarShell>{children}</AdminSidebarShell>
    </div>
  );
}
