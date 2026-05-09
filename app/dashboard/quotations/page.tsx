"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Eye, Download, Edit } from "lucide-react";
import { format } from "date-fns";
import { InvoiceFormData } from "@/types/invoice";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuotationsPage() {
  const { data: session } = useSession();
  const [quotations, setQuotations] = useState<(InvoiceFormData & { _id: string, createdAt: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/invoices?type=quotation")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setQuotations(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return <Badge className="bg-green-500 hover:bg-green-600">Accepted</Badge>; // mapping paid to accepted
      case "Unpaid":
        return <Badge variant="secondary">Pending</Badge>;
      case "Hold":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Draft</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotations</h1>
          <p className="text-muted-foreground">Manage your quotations here.</p>
        </div>
        {session?.user?.role === "Super Admin" && (
          <Button asChild>
            <Link href="/dashboard/quotations/create">
              <Plus className="mr-2 h-4 w-4" />
              New Quotation
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Quotations</CardTitle>
          <CardDescription>A list of all your created quotations.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {["Quotation No.", "Client", "Date", "Amount", "Status", "Actions"].map((h) => (
                      <TableHead key={h}><Skeleton className="h-3 w-20" /></TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["w-20","w-28","w-24","w-16","w-14","w-8"],
                    ["w-24","w-32","w-24","w-16","w-16","w-8"],
                    ["w-20","w-24","w-24","w-14","w-14","w-8"],
                    ["w-24","w-28","w-24","w-16","w-16","w-8"],
                  ].map((widths, ri) => (
                    <TableRow key={ri}>
                      {widths.map((w, ci) => (
                        <TableCell key={ci}><Skeleton className={`h-4 ${w}`} /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : quotations.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No quotations found.</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quotation No.</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotations.map((inv) => (
                    <TableRow key={inv._id}>
                      <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                      <TableCell>{inv.to.name}</TableCell>
                      <TableCell>{format(new Date(inv.date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{inv.paymentInfo?.currency || "USD"} {inv.total.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(inv.status)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" asChild title="Preview">
                          <Link href={`/dashboard/invoices/${inv._id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
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
