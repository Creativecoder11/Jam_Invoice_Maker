"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleUpdateStatus = async (id: string, status: string) => {
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
    }
  };

  if (session?.user?.role !== "Super Admin") {
    return <div>Access Denied</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">Approve or reject employee accounts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>Manage access to Jamroll Invoicemaker.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.role}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={u.status === "approved" ? "default" : u.status === "rejected" ? "destructive" : "secondary"}
                        >
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {u._id !== session?.user?.id && u.role !== "Super Admin" && (
                          <>
                            {(u.status === "pending" || u.status === "rejected") && (
                              <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(u._id, "approved")}>
                                <Check className="h-4 w-4 mr-1 text-green-500" /> Approve
                              </Button>
                            )}
                            {(u.status === "pending" || u.status === "approved") && (
                              <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(u._id, "rejected")}>
                                <X className="h-4 w-4 mr-1 text-red-500" /> Reject
                              </Button>
                            )}
                          </>
                        )}
                        {u._id === session?.user?.id && <span className="text-xs text-muted-foreground">You</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
