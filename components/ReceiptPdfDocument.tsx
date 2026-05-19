import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import path from "node:path";
import { readFileSync } from "node:fs";
import { InvoiceFormData, InvoiceItem } from "@/types/invoice";
import type { ReactElement, ReactNode } from "react";

const publicPath = path.join(process.cwd(), "public");

type NodeRuntimeGlobal = typeof globalThis & {
  require?: NodeRequire;
};

declare const __non_webpack_require__: NodeRequire | undefined;

function loadReactForPdfRenderer() {
  const runtimeGlobal = globalThis as NodeRuntimeGlobal;
  const runtimeRequire =
    typeof __non_webpack_require__ === "function"
      ? __non_webpack_require__
      : runtimeGlobal.require;

  if (!runtimeRequire) {
    throw new Error("PDF renderer could not load the Node React runtime");
  }

  return runtimeRequire("react") as typeof import("react");
}

const { createElement } = loadReactForPdfRenderer();

function pdfElement(
  type: any,
  props?: any,
  ...children: ReactNode[]
): ReactElement {
  return createElement(type, props, ...children) as ReactElement;
}

Font.register({
  family: "HelveticaNowDisplay",
  fonts: [
    {
      src: path.join(publicPath, "fonts", "HelveticaNowDisplay-Regular.ttf"),
      fontWeight: 400,
      fontStyle: "normal",
    },
    {
      src: path.join(publicPath, "fonts", "HelveticaNowDisplay-Regular.ttf"),
      fontWeight: 400,
      fontStyle: "italic",
    },
    {
      src: path.join(publicPath, "fonts", "HelveticaNowDisplay-Medium.ttf"),
      fontWeight: 500,
      fontStyle: "normal",
    },
    {
      src: path.join(publicPath, "fonts", "HelveticaNowDisplay-Bold.ttf"),
      fontWeight: 700,
      fontStyle: "normal",
    },
  ],
});

const jamrollLogoPath = path.join(publicPath, "assets", "Jamroll Logo.png");
const jamrollLogoDataUri = `data:image/png;base64,${readFileSync(jamrollLogoPath).toString("base64")}`;

const STATUS_COLORS: Record<string, string> = {
  Paid: "#16a34a",
  Unpaid: "#7c3aed",
  Hold: "#d97706",
  Cancelled: "#dc2626",
};

const styles = StyleSheet.create({
  page: {
    width: 612,
    minHeight: 842,
    padding: 30,
    backgroundColor: "#ffffff",
    color: "#000000",
    fontFamily: "HelveticaNowDisplay",
    fontSize: 12,
  },
  content: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  logo: {
    width: 73,
    height: 100,
    objectFit: "cover",
    borderRadius: 4,
  },
  logoPlaceholder: {
    width: 73,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
  },
  placeholderText: {
    fontSize: 10,
    color: "#9ca3af",
  },
  partyBlock: {
    marginBottom: 8,
  },
  accentLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#5A378F",
    marginBottom: 2,
  },
  partyName: {
    fontWeight: 700,
    fontSize: 11,
  },
  mutedText: {
    fontSize: 11,
    color: "#4b5563",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 14,
  },
  titleLeft: {
    flexDirection: "column",
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#1e1e2e",
  },
  invoiceNum: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  titleRight: {
    alignItems: "flex-end",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginRight: 6,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: 700,
  },
  statusPill: {
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 700,
    color: "#ffffff",
    textTransform: "uppercase",
  },
  table: {
    borderTopWidth: 2,
    borderTopColor: "#5A378F",
    paddingTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    color: "#5A378F",
    fontWeight: 700,
    fontSize: 11,
    paddingBottom: 6,
  },
  descColumn: {
    flex: 1,
  },
  numberColumn: {
    width: 60,
    textAlign: "center",
  },
  priceColumn: {
    width: 90,
    textAlign: "center",
  },
  amountColumn: {
    width: 90,
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingVertical: 7,
  },
  itemName: {
    fontWeight: 600,
    fontSize: 12,
  },
  itemNote: {
    fontSize: 10,
    color: "#6b7280",
    fontStyle: "italic",
    marginTop: 2,
  },
  subItem: {
    fontSize: 10,
    color: "#4b5563",
    marginTop: 2,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
  footer: {
    marginTop: 16,
  },
  totalsWrapper: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  totalsBox: {
    width: 260,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
    fontSize: 12,
  },
  totalsLabel: {
    color: "#6b7280",
  },
  totalsValue: {
    fontWeight: 600,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 2,
    borderTopColor: "#5A378F",
    paddingTop: 6,
    marginTop: 6,
    fontSize: 14,
    fontWeight: 700,
  },
  grandTotalLabel: {
    color: "#5A378F",
  },
  grandTotalValue: {
    color: "#5A378F",
  },
  paymentBox: {
    backgroundColor: "#5A3691",
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#ffffff",
    marginBottom: 12,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#ffffff",
  },
  paymentDetails: {
    fontSize: 9,
    lineHeight: 1.7,
  },
  paymentLine: {
    flexDirection: "row",
  },
  paymentLineLabel: {
    color: "#c4b5fd",
    marginRight: 3,
  },
  paymentLineValue: {
    fontWeight: 700,
    color: "#ffffff",
  },
  thankYou: {
    textAlign: "center",
    fontSize: 11,
    color: "#9ca3af",
    fontStyle: "italic",
    marginBottom: 12,
  },
  pageFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
    marginTop: 16,
  },
  pageFooterText: {
    color: "#4b5563",
    fontSize: 11,
  },
  pageFooterLogo: {
    width: 140,
    height: 44,
    objectFit: "contain",
  },
});

type ReceiptPdfProps = {
  receipt: Partial<InvoiceFormData>;
};

export function createReceiptPdfDocument(receipt: Partial<InvoiceFormData>) {
  const {
    invoiceNumber = "REC-001",
    name = "Receipt",
    logoUrl,
    from = { name: "", email: "", phone: "", address: "" },
    to = { name: "", email: "", phone: "", address: "" },
    date = new Date(),
    paymentInfo = { accountName: "", accountNumber: "", bankName: "", branch: "", swift: "", currency: "USD" },
    items = [],
    vat = 0,
    discount = 0,
    status = "Paid",
  } = receipt;

  const currency = paymentInfo.currency || "USD";
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const vatAmount = ((subtotal - (discount ?? 0)) * (vat ?? 0)) / 100;
  const grandTotal = subtotal + vatAmount - (discount ?? 0);
  const statusColor = STATUS_COLORS[status] ?? "#6b7280";

  return pdfElement(
    Document,
    null,
    pdfElement(
      Page,
      { size: [612, 842], style: styles.page, wrap: true },
      pdfElement(
        View,
        { style: styles.content },

        // Header: logo + from/to
        pdfElement(
          View,
          { style: styles.header },
          logoUrl
            ? pdfElement(Image, { src: logoUrl, style: styles.logo })
            : pdfElement(
                View,
                { style: styles.logoPlaceholder },
                pdfElement(Text, { style: styles.placeholderText }, "Logo"),
              ),
          pdfElement(
            View,
            { style: { alignItems: "flex-end" } },
            // Issued by
            pdfElement(
              View,
              { style: [styles.partyBlock, { alignItems: "flex-end" }] },
              pdfElement(Text, { style: styles.accentLabel }, "Issued by:"),
              pdfElement(Text, { style: styles.partyName }, from.name),
              from.email ? pdfElement(Text, { style: styles.mutedText }, from.email) : null,
              from.phone ? pdfElement(Text, { style: styles.mutedText }, from.phone) : null,
            ),
            // Issued to
            pdfElement(
              View,
              { style: [styles.partyBlock, { alignItems: "flex-end" }] },
              pdfElement(Text, { style: styles.accentLabel }, "Issued to:"),
              pdfElement(Text, { style: styles.partyName }, to.name),
              to.address ? pdfElement(Text, { style: styles.mutedText }, to.address) : null,
              to.email ? pdfElement(Text, { style: styles.mutedText }, to.email) : null,
              to.phone ? pdfElement(Text, { style: styles.mutedText }, to.phone) : null,
            ),
          ),
        ),

        // Title row
        pdfElement(
          View,
          { style: styles.titleRow },
          pdfElement(
            View,
            { style: styles.titleLeft },
            pdfElement(Text, { style: styles.title }, name),
            pdfElement(Text, { style: styles.invoiceNum }, `#${invoiceNumber}`),
          ),
          pdfElement(
            View,
            { style: styles.titleRight },
            pdfElement(
              View,
              { style: styles.dateRow },
              pdfElement(Text, { style: styles.dateLabel }, "Date:"),
              pdfElement(
                Text,
                { style: styles.dateValue },
                format(new Date(date), "MMM dd, yyyy"),
              ),
            ),
            pdfElement(
              Text,
              { style: [styles.statusPill, { backgroundColor: statusColor }] },
              status,
            ),
          ),
        ),

        // Items table
        pdfElement(
          View,
          { style: styles.table },
          pdfElement(
            View,
            { style: styles.tableHeader, fixed: true },
            pdfElement(Text, { style: styles.descColumn }, "Description"),
            pdfElement(Text, { style: styles.numberColumn }, "Qty"),
            pdfElement(Text, { style: styles.priceColumn }, "Unit Price"),
            pdfElement(Text, { style: styles.amountColumn }, "Amount"),
          ),
          items.length > 0
            ? items.map((item, index) =>
                pdfElement(ReceiptItemRow, {
                  key: `${item.name}-${index}`,
                  item,
                  index,
                  currency,
                }),
              )
            : pdfElement(Text, { style: styles.emptyText }, "No items added"),
        ),

        // Footer: totals + payment + thank you
        pdfElement(
          View,
          { style: styles.footer, wrap: false },
          pdfElement(
            View,
            { style: styles.totalsWrapper },
            pdfElement(
              View,
              { style: styles.totalsBox },
              pdfElement(
                View,
                { style: styles.totalsRow },
                pdfElement(Text, { style: styles.totalsLabel }, "Sub-Total"),
                pdfElement(Text, { style: styles.totalsValue }, `${currency} ${subtotal.toFixed(2)}`),
              ),
              (vat ?? 0) > 0
                ? pdfElement(
                    View,
                    { style: styles.totalsRow },
                    pdfElement(Text, { style: styles.totalsLabel }, `VAT (${vat}%)`),
                    pdfElement(Text, { style: styles.totalsValue }, `${currency} ${vatAmount.toFixed(2)}`),
                  )
                : null,
              (discount ?? 0) > 0
                ? pdfElement(
                    View,
                    { style: styles.totalsRow },
                    pdfElement(Text, { style: styles.totalsLabel }, "Discount"),
                    pdfElement(Text, { style: styles.totalsValue }, `- ${currency} ${Number(discount).toFixed(2)}`),
                  )
                : null,
              pdfElement(
                View,
                { style: styles.grandTotalRow },
                pdfElement(Text, { style: styles.grandTotalLabel }, "TOTAL"),
                pdfElement(Text, { style: styles.grandTotalValue }, `${currency} ${grandTotal.toFixed(2)}`),
              ),
            ),
          ),
          pdfElement(
            View,
            { style: styles.paymentBox },
            pdfElement(Text, { style: styles.paymentTitle }, "Payment Information"),
            pdfElement(
              View,
              { style: styles.paymentDetails },
              paymentInfo.accountNumber
                ? pdfElement(
                    View,
                    { style: styles.paymentLine },
                    pdfElement(Text, { style: styles.paymentLineLabel }, "Account:"),
                    pdfElement(Text, { style: styles.paymentLineValue }, paymentInfo.accountNumber),
                  )
                : null,
              paymentInfo.swift
                ? pdfElement(
                    View,
                    { style: styles.paymentLine },
                    pdfElement(Text, { style: styles.paymentLineLabel }, "SWIFT:"),
                    pdfElement(Text, { style: styles.paymentLineValue }, paymentInfo.swift),
                  )
                : null,
              paymentInfo.bankName
                ? pdfElement(
                    View,
                    { style: styles.paymentLine },
                    pdfElement(Text, { style: styles.paymentLineLabel }, "Bank:"),
                    pdfElement(Text, { style: styles.paymentLineValue }, paymentInfo.bankName),
                  )
                : null,
              paymentInfo.branch
                ? pdfElement(
                    View,
                    { style: styles.paymentLine },
                    pdfElement(Text, { style: styles.paymentLineLabel }, "Branch:"),
                    pdfElement(Text, { style: styles.paymentLineValue }, paymentInfo.branch),
                  )
                : null,
            ),
          ),
          pdfElement(
            Text,
            { style: styles.thankYou },
            "Thank you for your business!",
          ),
        ),
      ),

      // Page footer (fixed — shows on every page)
      pdfElement(
        View,
        { style: styles.pageFooter, fixed: true },
        pdfElement(
          View,
          { style: styles.pageFooterText },
          pdfElement(Text, null, "+880 1784 398 934"),
          pdfElement(Text, null, "info@jamroll.xyz"),
          pdfElement(Text, null, "www.jamroll.xyz"),
        ),
        pdfElement(Image, { src: jamrollLogoDataUri, style: styles.pageFooterLogo }),
      ),
    ),
  );
}

function ReceiptItemRow({
  item,
  index,
  currency,
}: {
  item: InvoiceItem;
  index: number;
  currency: string;
}) {
  return pdfElement(
    View,
    { style: styles.tableRow, wrap: false },
    pdfElement(
      View,
      { style: styles.descColumn },
      pdfElement(Text, { style: styles.itemName }, `${index + 1}. ${item.name}`),
      item.note ? pdfElement(Text, { style: styles.itemNote }, item.note) : null,
      item.subItems?.map((sub, si) =>
        pdfElement(Text, { key: `${sub}-${si}`, style: styles.subItem }, `— ${sub}`),
      ),
    ),
    pdfElement(Text, { style: [styles.numberColumn, { fontSize: 12 }] }, String(item.quantity)),
    pdfElement(Text, { style: [styles.priceColumn, { fontSize: 12 }] }, `${currency} ${item.unitPrice.toFixed(2)}`),
    pdfElement(
      Text,
      { style: [styles.amountColumn, { fontSize: 12, fontWeight: 600 }] },
      `${currency} ${(item.quantity * item.unitPrice).toFixed(2)}`,
    ),
  );
}
