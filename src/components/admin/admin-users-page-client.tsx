"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, Pencil, Search, Trash2, UserRoundCog } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  deleteAdminUserById,
  getAdminUserById,
  listAdminUsers,
  type AdminRole,
  type AdminUser,
  updateAdminUserRole,
} from "@/lib/client/admin-users-api";
import { ApiError } from "@/lib/client/api-client";

const PAGE_SIZE = 10;
const ROLE_OPTIONS: AdminRole[] = ["user", "admin", "super_admin"];
type BadgeVariant = "default" | "secondary" | "warning";

function formatDate(dateLike: unknown): string {
  if (typeof dateLike !== "string") return "—";
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function roleBadgeVariant(role: string): BadgeVariant {
  if (role === "super_admin") return "warning";
  if (role === "admin") return "default";
  return "secondary";
}

export function AdminUsersPageClient() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<AdminRole>("user");
  const [isEditOpen, setIsEditOpen] = useState(false);

  const debouncedQuery = useDebouncedValue(query, 350);
  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));

  const loadUsers = useCallback(async (currentPage: number, searchTerm: string) => {
    setIsLoadingList(true);
    try {
      const response = await listAdminUsers({
        page: currentPage,
        limit: PAGE_SIZE,
        search: searchTerm || undefined,
      });
      setUsers(response.items);
      setTotalUsers(response.total);
      if (!response.items.length) {
        setSelectedUserId(null);
        setSelectedUser(null);
      } else if (!selectedUserId || !response.items.some((item) => item.id === selectedUserId)) {
        setSelectedUserId(response.items[0]?.id ?? null);
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to load users.";
      toast.error(message);
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setIsLoadingList(false);
    }
  }, [selectedUserId]);

  const loadUserDetail = useCallback(async (userId: string) => {
    setIsLoadingDetail(true);
    try {
      const detail = await getAdminUserById(userId);
      setSelectedUser(detail);
      setSelectedRole((typeof detail.role === "string" ? detail.role : "user") as AdminRole);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to load user detail.";
      toast.error(message);
      setSelectedUser(null);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers(page, debouncedQuery.trim());
  }, [loadUsers, page, debouncedQuery]);

  useEffect(() => {
    if (!selectedUserId) return;
    void loadUserDetail(selectedUserId);
  }, [loadUserDetail, selectedUserId]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  const selectedRoleLabel = useMemo(() => selectedRole.replace("_", " "), [selectedRole]);

  async function onRefresh() {
    await loadUsers(page, debouncedQuery.trim());
    if (selectedUserId) await loadUserDetail(selectedUserId);
  }

  async function onSaveRole() {
    if (!selectedUserId) return;
    setIsSavingRole(true);
    try {
      await updateAdminUserRole(selectedUserId, selectedRole);
      toast.success("Role updated successfully.");
      await onRefresh();
      setIsEditOpen(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to update role.";
      toast.error(message);
    } finally {
      setIsSavingRole(false);
    }
  }

  async function onDeleteUser() {
    if (!selectedUserId) return;
    const confirmed = window.confirm("Delete this user account permanently?");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteAdminUserById(selectedUserId);
      toast.success("User account deleted.");
      setSelectedUserId(null);
      setSelectedUser(null);
      await loadUsers(page, debouncedQuery.trim());
      setIsEditOpen(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to delete user.";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminDashboardHeader
        title="Admin Dashboard"
        subtitle="Manage users, roles, and account access."
        onRefresh={onRefresh}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-purple-100 bg-white">
          <CardHeader className="pb-2">
            <CardDescription>Total users</CardDescription>
            <CardTitle className="text-3xl text-purple-700">{totalUsers}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-5">
        <Card className="border-purple-100 bg-white">
          <CardHeader className="space-y-3">
            <CardTitle className="text-lg">Users Listing</CardTitle>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-500" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, phone, role..."
                className="h-11 border-purple-200 pl-9 focus-visible:ring-purple-300"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingList ? (
              <div className="flex min-h-64 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
              </div>
            ) : users.length === 0 ? (
              <div className="rounded-xl border border-dashed border-purple-200 py-14 text-center text-sm text-zinc-500">
                No users found for this filter.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-purple-100">
                <table className="w-full text-left">
                  <thead className="bg-purple-50 text-xs uppercase tracking-wide text-purple-700">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const isSelected = user.id === selectedUserId;
                      return (
                        <tr
                          key={user.id}
                          className={`cursor-pointer border-t border-purple-100 transition hover:bg-purple-50 ${
                            isSelected ? "bg-purple-50" : "bg-white"
                          }`}
                          onClick={() => setSelectedUserId(user.id)}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-zinc-900">{String(user.full_name ?? "—")}</td>
                          <td className="px-4 py-3 text-sm text-zinc-600">{String(user.phone ?? "—")}</td>
                          <td className="px-4 py-3">
                            <Badge variant={roleBadgeVariant(String(user.role ?? "user"))}>
                              {String(user.role ?? "user")}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-500">{formatDate(user.created_at)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button asChild variant="outline" size="sm" className="border-purple-200">
                                <Link
                                  href={`/admin/users/${encodeURIComponent(user.id)}?mode=view`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                  }}
                                >
                                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                                  View
                                </Link>
                              </Button>
                              <Button asChild size="sm" className="bg-purple-700 hover:bg-purple-800">
                                <Link
                                  href={`/admin/users/${encodeURIComponent(user.id)}?mode=edit`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                  }}
                                >
                                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                  Edit
                                </Link>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-zinc-600">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-purple-200"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  className="border-purple-200"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user role or remove account.</DialogDescription>
          </DialogHeader>
          {!selectedUserId ? (
            <p className="text-sm text-zinc-500">Select a user first.</p>
          ) : isLoadingDetail ? (
            <div className="flex min-h-28 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
            </div>
          ) : !selectedUser ? (
            <p className="text-sm text-zinc-500">Could not load user details.</p>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3">
                <p className="text-xs text-zinc-500">User</p>
                <p className="text-sm font-medium text-zinc-900">{String(selectedUser.full_name ?? "—")}</p>
                <p className="text-xs text-zinc-600">{String(selectedUser.phone ?? "—")}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role-select">Role</Label>
                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AdminRole)}>
                  <SelectTrigger id="role-select" className="border-purple-200">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-zinc-500">Selected role: {selectedRoleLabel}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting || !selectedUserId}
              onClick={() => void onDeleteUser()}
            >
              {isDeleting ? (
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
            <Button
              type="button"
              className="bg-purple-700 hover:bg-purple-800"
              disabled={isSavingRole || !selectedUserId}
              onClick={() => void onSaveRole()}
            >
              {isSavingRole ? (
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
