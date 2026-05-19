"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Download, Printer, ArrowLeft } from "lucide-react";
import { ReceiptPreview } from "@/components/ReceiptPreview";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";

export default function ViewReceiptPage() {
  const { id }   = useParams();
  const router   = useRouter();

  const [data, setData]               = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((res) => { if (!res.ok) throw new Error("Not found"); return res.json(); })
      .then((d)   => { setData(d); setLoading(false); })
      .catch(()   => { toast.error("Receipt not found"); setLoading(false); });
  }, [id]);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    const tid = toast.loading("Generating PDF…");
    try {
      const res = await fetch(`/api/invoices/${id}/receipt-pdf`);
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${data?.invoiceNumber || "receipt"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded", { id: tid });
    } catch {
      toast.dismiss(tid);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

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
          <div className="space-y-4 w-full max-w-lg">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-center text-destructive">Receipt not found or you don't have access.</div>;
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
          <Button variant="outline" onClick={() => window.print()}>
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
          <ReceiptPreview data={data} />
        </div>
      </div>
    </div>
  );
}
