import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createReceiptPdfDocument } from "@/components/ReceiptPdfDocument";
import type { ReactElement } from "react";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data        = await req.json();
    const pdfDocument = createReceiptPdfDocument(data) as ReactElement<DocumentProps>;
    const pdfBuffer   = await renderToBuffer(pdfDocument);

    return new Response(pdfBuffer as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${data.invoiceNumber || "receipt"}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Receipt PDF preview generation failed:", error);
    return NextResponse.json({ message: "PDF generation failed" }, { status: 500 });
  }
}
