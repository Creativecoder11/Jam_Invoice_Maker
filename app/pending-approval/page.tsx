"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function PendingApprovalPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-yellow-500/10 p-4">
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <CardTitle className="text-2xl">Account Pending</CardTitle>
          <CardDescription>Your account is waiting for administrator approval.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You have successfully registered, but a Super Admin needs to approve your account before you can access the Jamroll Invoicemaker system.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button variant="outline" onClick={() => signOut({ callbackUrl: "/login" })}>
            Log out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
