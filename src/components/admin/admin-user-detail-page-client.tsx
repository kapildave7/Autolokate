"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Trash2, UserRoundCog } from "lucide-react";
import { toast } from "sonner";
import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { AdminEmptyState, AdminLoadingState } from "@/components/admin/ui/admin-page-state";
import { DetailModeBadge } from "@/components/admin/ui/detail-mode-badge";
import { isReadOnly, readDetailMode } from "@/components/admin/ui/detail-mode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/client/api-client";
import { deleteAdminUserById, getAdminUserById, type AdminRole, type AdminUser, updateAdminUserRole } from "@/lib/client/admin-users-api";

const ROLE_OPTIONS: AdminRole[] = ["user", "admin", "super_admin"];

function pretty(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export function AdminUserDetailPageClient({ userId }: { userId: string }) {
  const searchParams = useSearchParams();
  const mode = readDetailMode(searchParams.get("mode"));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [role, setRole] = useState<AdminRole>("user");

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const detail = await getAdminUserById(userId);
      setUser(detail);
      setRole((typeof detail.role === "string" ? detail.role : "user") as AdminRole);
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to load user details.";
      toast.error(message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const entries = useMemo(() => (user ? Object.entries(user) : []), [user]);

  async function onSaveRole() {
    if (!user?.id) return;
    setSaving(true);
    try {
      await updateAdminUserRole(user.id, role);
      toast.success("User role updated.");
      await loadUser();
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to update role.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!user?.id) return;
    const confirmed = window.confirm("Delete this user permanently?");
    if (!confirmed) return;
    setDeleting(true);
    try {
      await deleteAdminUserById(user.id);
      toast.success("User deleted.");
      window.location.href = "/admin/users";
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to delete user.";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminDashboardHeader title="User Details" subtitle="Complete user profile and admin actions." onRefresh={loadUser} />
      <div className="mb-4 flex items-center justify-between">
        <Button asChild variant="outline" className="border-purple-200">
          <Link href="/admin/users">Back to Users</Link>
        </Button>
        <DetailModeBadge mode={mode} />
      </div>
      {loading ? (
        <AdminLoadingState label="Loading user details..." />
      ) : !user ? (
        <AdminEmptyState label="User not found." />
      ) : (
        <div className="space-y-6">
          <Card className="border-purple-100 bg-white">
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>All fields from user detail API.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-xl border border-purple-100">
                <table className="w-full text-left">
                  <thead className="bg-purple-50 text-xs uppercase tracking-wide text-purple-700">
                    <tr>
                      <th className="px-4 py-3">Field</th>
                      <th className="px-4 py-3">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(([key, value]) => (
                      <tr key={key} className="border-t border-purple-100">
                        <td className="px-4 py-2 text-sm font-medium text-zinc-700">{key}</td>
                        <td className="px-4 py-2 text-sm text-zinc-600">
                          <pre className="whitespace-pre-wrap wrap-break-word">{pretty(value)}</pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 bg-white">
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
              <CardDescription>Update role or force delete account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-sm space-y-1.5">
                <Label>Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as AdminRole)} disabled={isReadOnly(mode)}>
                  <SelectTrigger className="border-purple-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="destructive" disabled={deleting || isReadOnly(mode)} onClick={() => void onDelete()}>
                  {deleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete User
                    </>
                  )}
                </Button>
                <Button type="button" className="bg-purple-700 hover:bg-purple-800" disabled={saving || isReadOnly(mode)} onClick={() => void onSaveRole()}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <UserRoundCog className="mr-2 h-4 w-4" />
                      Update Role
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
