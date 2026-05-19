"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Download, Printer, ArrowLeft } from "lucide-react";
import { ReceiptPreview, PAGE_WIDTH_R, PAGE_HEIGHT_R } from "@/components/ReceiptPreview";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";

export default function ViewReceiptPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData]           = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((res) => { if (!res.ok) throw new Error("Not found"); return res.json(); })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { toast.error("Receipt not found"); setLoading(false); });
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!printRef.current) { toast.error("Receipt not found"); return; }
    try {
      setDownloading(true);
      const pageEls = printRef.current.querySelectorAll<HTMLElement>("[data-invoice-page]");
      if (!pageEls.length) { toast.error("Receipt not found"); return; }

      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: [PAGE_WIDTH_R, PAGE_HEIGHT_R] });
      for (let i = 0; i < pageEls.length; i++) {
        const canvas = await html2canvas(pageEls[i], {
          scale: 3, useCORS: true, allowTaint: false, logging: false,
          backgroundColor: "#ffffff", scrollX: 0, scrollY: 0,
          onclone: (_doc, clonedEl) => {
            clonedEl.style.marginBottom = "0";
            let p: HTMLElement | null = clonedEl.parentElement;
            while (p && p.tagName !== "BODY") { p.style.transform = "none"; p.style.zoom = "1"; p = p.parentElement; }
          },
        });
        const imgData = canvas.toDataURL("image/png", 1.0);
        if (i > 0) pdf.addPage([PAGE_WIDTH_R, PAGE_HEIGHT_R], "portrait");
        pdf.addImage(imgData, "PNG", 0, 0, PAGE_WIDTH_R, PAGE_HEIGHT_R);
      }
      pdf.save(`${data.invoiceNumber || "receipt"}.pdf`);
      toast.success("PDF downloaded");
    } catch (error) {
      console.error(error);
      toast.error("PDF generation failed");
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
          <ReceiptPreview data={data} ref={printRef} />
        </div>
      </div>
    </div>
  );
}
