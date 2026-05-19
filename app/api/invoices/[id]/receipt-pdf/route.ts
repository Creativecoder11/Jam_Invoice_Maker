import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import { Invoice } from "@/models/Invoice";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createReceiptPdfDocument } from "@/components/ReceiptPdfDocument";
import type { ReactElement } from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const receipt = await Invoice.findById(id).lean<any>();
    if (!receipt) {
      return NextResponse.json({ message: "Not Found" }, { status: 404 });
    }

    const pdfDocument = createReceiptPdfDocument(receipt) as ReactElement<DocumentProps>;
    const pdfBuffer   = await renderToBuffer(pdfDocument);

    return new Response(pdfBuffer as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${receipt.invoiceNumber || "receipt"}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Receipt PDF generation failed:", error);
    return NextResponse.json({ message: "PDF generation failed" }, { status: 500 });
  }
}

// POST — generate PDF from raw form data (used by create/edit pages before saving)
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
    console.error("Receipt PDF generation failed:", error);
    return NextResponse.json({ message: "PDF generation failed" }, { status: 500 });
  }
}
