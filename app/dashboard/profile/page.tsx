"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Your personal account information.</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>View your account settings and status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback className="text-2xl">{session?.user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{session?.user?.name}</h2>
              <p className="text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t pt-6">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground">Role</h3>
              <p className="font-medium mt-1">{session?.user?.role}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground">Account Status</h3>
              <div className="mt-1">
                <Badge variant={session?.user?.status === "approved" ? "default" : "secondary"}>
                  {session?.user?.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
