"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Download, Printer, ArrowLeft } from "lucide-react";
import { InvoicePreview } from "@/components/InvoicePreview";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";

export default function ViewInvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Invoice not found");
        setLoading(false);
      });
  }, [id]);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const res = await fetch(`/api/invoices/${id}/pdf`);
      if (!res.ok) throw new Error("PDF generation failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data?.invoiceNumber || "invoice"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch (error) {
      console.error(error);
      toast.error("PDF generation failed");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-7 w-40" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>
        <div className="bg-muted/20 p-8 rounded-xl border flex justify-center">
          <div className="w-153 bg-white rounded-lg p-8 space-y-6">
            <div className="flex justify-between">
              <Skeleton className="h-27.5 w-18.25 rounded" />
              <div className="space-y-2 w-40">
                <Skeleton className="h-3 w-16 ml-auto" />
                <Skeleton className="h-3 w-28 ml-auto" />
                <Skeleton className="h-3 w-24 ml-auto" />
                <Skeleton className="h-3 w-20 ml-auto mt-3" />
                <Skeleton className="h-3 w-28 ml-auto" />
                <Skeleton className="h-3 w-24 ml-auto" />
              </div>
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="space-y-2 pt-2 border-t">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-4 py-2 border-b border-gray-100">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-12 ml-auto" />
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-14" />
                </div>
              ))}
            </div>
            <div className="flex justify-end space-y-2">
              <div className="w-48 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-destructive">
        Document not found or you don't have access.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{data.invoiceNumber || data.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          <Button onClick={handleDownloadPDF} disabled={downloading}>
            {downloading ? <Spinner className="h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
            {downloading ? "Generating…" : "Download PDF"}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto bg-muted/20 p-8 rounded-xl border flex justify-center print:p-0 print:border-none print:bg-white print:overflow-visible">
        <div className="scale-75 md:scale-100 origin-top print:scale-100">
          <InvoicePreview data={data} />
        </div>
      </div>
    </div>
  );
}
