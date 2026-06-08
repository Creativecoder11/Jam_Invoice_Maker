"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X, ShieldCheck, ShieldOff } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = useCallback(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUpdateRole = async (id: string, role: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        toast.success(`User role updated to ${role}`);
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to update role");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`User marked as ${status}`);
        fetchUsers();
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setUpdatingId(null);
    }
  };

  if (session?.user?.role !== "Super Admin") {
    return <div className="text-sm text-[#1A1A1A]/40">Access Denied</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A]">User Management</h1>
        <p className="text-sm md:text-base text-[#1A1A1A]/60 mt-0.5">Approve or reject employee accounts</p>
      </div>

      <Card className="rounded-xl border border-[#E8E8E8] shadow-none">
        <CardHeader>
          <CardTitle className="text-base md:text-lg font-semibold text-[#1A1A1A]">System Users</CardTitle>
          <CardDescription className="text-sm text-[#1A1A1A]/40">Manage access to Jamroll Invoicemaker.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-[#E8E8E8] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F0F0F0]/60 hover:bg-[#F0F0F0]/60 border-b border-[#E8E8E8]">
                  <TableHead className="text-xs md:text-sm font-semibold text-[#1A1A1A]/40 uppercase tracking-wider">Name</TableHead>
                  <TableHead className="text-xs md:text-sm font-semibold text-[#1A1A1A]/40 uppercase tracking-wider">Email</TableHead>
                  <TableHead className="text-xs md:text-sm font-semibold text-[#1A1A1A]/40 uppercase tracking-wider">Role</TableHead>
                  <TableHead className="text-xs md:text-sm font-semibold text-[#1A1A1A]/40 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-xs md:text-sm font-semibold text-[#1A1A1A]/40 uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [
                    ["w-28", "w-40", "w-20", "w-16", "w-24"],
                    ["w-24", "w-36", "w-24", "w-16", "w-24"],
                    ["w-32", "w-44", "w-20", "w-16", "w-24"],
                    ["w-24", "w-40", "w-24", "w-16", "w-24"],
                  ].map((widths, ri) => (
                    <TableRow key={ri}>
                      {widths.map((w, ci) => (
                        <TableCell key={ci}><Skeleton className={`h-4 ${w}`} /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  users.map((u) => (
                    <TableRow key={u._id} className={`border-b border-[#F0F0F0] transition-colors hover:bg-[#F0F0F0]/40 ${updatingId === u._id ? "opacity-60" : ""}`}>
                      <TableCell className="font-semibold text-[#1A1A1A] text-sm md:text-base">{u.name}</TableCell>
                      <TableCell className="text-[#1A1A1A]/60 text-sm md:text-base">{u.email}</TableCell>
                      <TableCell className="text-[#1A1A1A]/70 text-sm md:text-base">{u.role}</TableCell>
                      <TableCell>
                        <Badge className={
                          u.status === "approved" ? "bg-[#E1F5EE] text-[#085041] border-0 font-semibold" :
                            u.status === "rejected" ? "bg-[#FBEAF0] text-[#72243E] border-0 font-semibold" :
                              "bg-[#EEEDFE] text-[#3C3489] border-0 font-semibold"
                        }>
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {u._id !== session?.user?.id ? (
                          <>
                            {u.role !== "Super Admin" && (
                              <>
                                {(u.status === "pending" || u.status === "rejected") && (
                                  <Button
                                    className="h-8 px-3 text-xs rounded-lg border border-[#E8E8E8] bg-white hover:bg-[#E1F5EE] text-[#1A1A1A]/70 hover:text-[#085041] transition-colors"
                                    disabled={updatingId === u._id}
                                    onClick={() => handleUpdateStatus(u._id, "approved")}
                                  >
                                    {updatingId === u._id ? (
                                      <Spinner className="h-3.5 w-3.5 mr-1" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5 mr-1 text-[#51B9A9]" />
                                    )}
                                    Approve
                                  </Button>
                                )}
                                {(u.status === "pending" || u.status === "approved") && (
                                  <Button
                                    className="h-8 px-3 text-xs rounded-lg border border-[#E8E8E8] bg-white hover:bg-[#FBEAF0] text-[#1A1A1A]/70 hover:text-[#72243E] transition-colors"
                                    disabled={updatingId === u._id}
                                    onClick={() => handleUpdateStatus(u._id, "rejected")}
                                  >
                                    {updatingId === u._id ? (
                                      <Spinner className="h-3.5 w-3.5 mr-1" />
                                    ) : (
                                      <X className="h-3.5 w-3.5 mr-1 text-[#EA2B7B]" />
                                    )}
                                    Reject
                                  </Button>
                                )}
                                <Button
                                  className="h-8 px-3 text-xs rounded-lg border border-[#E8E8E8] bg-white hover:bg-[#EEEDFE] text-[#1A1A1A]/70 hover:text-[#3C3489] transition-colors"
                                  disabled={updatingId === u._id}
                                  onClick={() => handleUpdateRole(u._id, "Super Admin")}
                                >
                                  {updatingId === u._id ? (
                                    <Spinner className="h-3.5 w-3.5 mr-1" />
                                  ) : (
                                    <ShieldCheck className="h-3.5 w-3.5 mr-1 text-[#5A378F]" />
                                  )}
                                  Make Admin
                                </Button>
                              </>
                            )}
                            {u.role === "Super Admin" && (
                              <Button
                                className="h-8 px-3 text-xs rounded-lg border border-[#E8E8E8] bg-white hover:bg-[#FFF8E1] text-[#1A1A1A]/70 hover:text-[#7A5C00] transition-colors"
                                disabled={updatingId === u._id}
                                onClick={() => handleUpdateRole(u._id, "Employee")}
                              >
                                {updatingId === u._id ? (
                                  <Spinner className="h-3.5 w-3.5 mr-1" />
                                ) : (
                                  <ShieldOff className="h-3.5 w-3.5 mr-1 text-[#7A5C00]" />
                                )}
                                Remove Admin
                              </Button>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-[#1A1A1A]/50">You</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
