"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Download, Printer, ArrowLeft } from "lucide-react";
import { InvoicePreview } from "@/components/InvoicePreview";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export default function ViewInvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

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
    if (!printRef.current) {
      toast.error("Could not find the invoice element");
      return;
    }

    const toastId = toast.loading("Generating PDF...");

    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdfWidthPt = 595.28; // A4 width in points
      const pdfHeightPt = (canvas.height / canvas.width) * pdfWidthPt;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: [pdfWidthPt, pdfHeightPt],
      });

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidthPt, pdfHeightPt);
      pdf.save(`${data.invoiceNumber || "Document"}.pdf`);

      toast.success("PDF Downloaded", { id: toastId });
    } catch (error: any) {
      console.error("PDF generation error:", error?.message, error);
      toast.dismiss(toastId);
      toast.error("Failed to generate PDF");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-8 text-center">Loading document...</div>;
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
          <Button onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto bg-muted/20 p-8 rounded-xl border flex justify-center print:p-0 print:border-none print:bg-white print:overflow-visible">
        <div className="scale-75 md:scale-100 origin-top print:scale-100">
          <InvoicePreview data={data} ref={printRef} />
        </div>
      </div>
    </div>
  );
}