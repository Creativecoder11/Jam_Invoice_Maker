import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import { Invoice } from "@/models/Invoice";
import React from "react";
import {
  InvoicePreview,
  PAGE_WIDTH,
  PAGE_HEIGHT,
} from "@/components/InvoicePreview";
import {
  Invoice2Preview,
  PAGE_WIDTH_2,
  PAGE_HEIGHT_2,
} from "@/components/Invoice2Preview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function launchBrowser(pageWidth: number, pageHeight: number) {
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = await import("puppeteer-core");
    return puppeteer.default.launch({
      args: chromium.args,
      defaultViewport: { width: pageWidth, height: pageHeight },
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const puppeteer = await import("puppeteer");
  return puppeteer.default.launch({
    headless: true,
    defaultViewport: { width: pageWidth, height: pageHeight },
  });
}

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

    const isInvoice2 = invoice.type === "invoice2";
    const pageWidth = isInvoice2 ? PAGE_WIDTH_2 : PAGE_WIDTH;
    const pageHeight = isInvoice2 ? PAGE_HEIGHT_2 : PAGE_HEIGHT;
    const { renderToString } = await import("react-dom/server");
    const bodyHtml = renderToString(
      isInvoice2
        ? React.createElement(Invoice2Preview, { data: invoice })
        : React.createElement(InvoicePreview, { data: invoice }),
    );
    const origin = new URL(req.url).origin;

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <base href="${origin}/" />
    <style>
      @font-face {
        font-family: 'HelveticaNowDisplay';
        src: url('${origin}/fonts/HelveticaNowDisplay-Regular.ttf') format('truetype');
        font-weight: 400;
        font-style: normal;
        font-display: block;
      }
      @font-face {
        font-family: 'HelveticaNowDisplay';
        src: url('${origin}/fonts/HelveticaNowDisplay-Medium.ttf') format('truetype');
        font-weight: 500;
        font-style: normal;
        font-display: block;
      }
      @font-face {
        font-family: 'HelveticaNowDisplay';
        src: url('${origin}/fonts/HelveticaNowDisplay-Bold.ttf') format('truetype');
        font-weight: 700;
        font-style: normal;
        font-display: block;
      }
      @page {
        size: ${pageWidth}px ${pageHeight}px;
        margin: 0;
      }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        font-family: 'HelveticaNowDisplay', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      h1, h2, h3, h4, h5, h6, p { margin: 0; }
      [data-invoice-page] { page-break-after: always; break-after: page; margin: 0 !important; }
      [data-invoice-page]:last-child { page-break-after: auto; break-after: auto; }
    </style>
  </head>
  <body>${bodyHtml}</body>
</html>`;

    const browser = await launchBrowser(pageWidth, pageHeight);
    try {
      const page = (await browser.newPage()) as any;
      await page.setViewport({
        width: pageWidth,
        height: pageHeight,
        deviceScaleFactor: 2,
      });
      await page.setContent(html, { waitUntil: "networkidle0" });
      await page.evaluate(async () => {
        if (document.fonts?.ready) {
          await document.fonts.ready;
        }
      });

      const pdfBuffer = await page.pdf({
        width: `${pageWidth}px`,
        height: `${pageHeight}px`,
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        preferCSSPageSize: true,
      });

      return new Response(pdfBuffer as any, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${invoice.invoiceNumber || "invoice"}.pdf"`,
          "Cache-Control": "no-store",
        },
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error("PDF generation failed:", error);
    return NextResponse.json(
      { message: "PDF generation failed" },
      { status: 500 },
    );
  }
}
