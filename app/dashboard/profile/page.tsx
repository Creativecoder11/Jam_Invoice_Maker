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
        <h1 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A]">Profile</h1>
        <p className="text-sm md:text-base text-[#1A1A1A]/60 mt-0.5">Your personal account information.</p>
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
              <AvatarFallback className="text-2xl bg-[#5A378F] text-white">{session?.user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold text-[#1A1A1A]">{session?.user?.name}</h2>
              <p className="text-sm text-[#1A1A1A]/40">{session?.user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-[#E8E8E8] pt-6">
            <div>
              <h3 className="font-medium text-xs uppercase tracking-wider text-[#1A1A1A]/40">Role</h3>
              <p className="font-semibold text-[#1A1A1A] mt-1">{session?.user?.role}</p>
            </div>
            <div>
              <h3 className="font-medium text-xs uppercase tracking-wider text-[#1A1A1A]/40">Account Status</h3>
              <div className="mt-1">
                <Badge className={
                  session?.user?.status === "approved"
                    ? "bg-[#E1F5EE] text-[#085041]"
                    : "bg-[#EEEDFE] text-[#3C3489]"
                }>
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
