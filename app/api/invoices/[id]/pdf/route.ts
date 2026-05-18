import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import { Invoice } from "@/models/Invoice";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createInvoicePdfDocument } from "@/components/InvoicePdfDocument";
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
    const invoice = await Invoice.findById(id).lean<any>();
    if (!invoice) {
      return NextResponse.json({ message: "Not Found" }, { status: 404 });
    }

    const pdfDocument = createInvoicePdfDocument(invoice) as ReactElement<DocumentProps>;
    const pdfBuffer = await renderToBuffer(pdfDocument);

    return new Response(pdfBuffer as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber || "invoice"}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return NextResponse.json(
      { message: "PDF generation failed" },
      { status: 500 },
    );
  }
}
