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
import {
  Invoice2FormData,
  InvoiceFormData,
  InvoiceItem,
  ServiceGroup,
  ServiceItem,
} from "@/types/invoice";
import { readFileSync } from "node:fs";
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

type InvoicePdfDocumentProps = {
  invoice: Partial<InvoiceFormData & Invoice2FormData>;
};

type TotalRow = {
  label: string;
  value: string;
};

const jamrollLogoPath = path.join(publicPath, "assets", "Jamroll Logo.png");
const jamrollLogoDataUri = `data:image/png;base64,${readFileSync(jamrollLogoPath).toString("base64")}`;

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
    marginBottom: 14,
  },
  logo: {
    width: 73,
    height: 110,
    objectFit: "cover",
    borderRadius: 4,
  },
  logoPlaceholder: {
    width: 73,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
  },
  placeholderText: {
    fontSize: 10,
    color: "#9ca3af",
  },
  clientBlock: {
    width: 240,
  },
  accentLabel: {
    color: "#5A378F",
    fontWeight: 700,
  },
  mutedText: {
    color: "#4b5563",
  },
  titleRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    textTransform: "uppercase",
    marginRight: 24,
  },
  datesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  dateItem: {
    flexDirection: "row",
  },
  dateLabel: {
    fontWeight: 700,
    marginRight: 4,
  },
  table: {
    borderTopWidth: 1,
    borderTopColor: "#7D7E81",
    paddingTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    color: "#5A378F",
    fontWeight: 700,
    paddingBottom: 6,
  },
  itemColumn: {
    width: "46%",
  },
  numberColumn: {
    width: "18%",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingVertical: 7,
  },
  itemName: {
    fontWeight: 600,
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
  serviceHeader: {
    backgroundColor: "#5A378F",
    color: "#ffffff",
    fontSize: 11,
    fontWeight: 700,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  serviceSubtotalRow: {
    flexDirection: "row",
    backgroundColor: "#f5f3ff",
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  serviceSubtotalLabel: {
    width: "82%",
    textAlign: "right",
    color: "#5A378F",
    fontSize: 10,
    fontWeight: 700,
  },
  serviceSubtotalValue: {
    width: "18%",
    textAlign: "center",
    color: "#5A378F",
    fontSize: 10,
    fontWeight: 700,
  },
  totals: {
    marginTop: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 32,
    borderTopWidth: 1,
    borderTopColor: "#B1B1B1",
  },
  totalLabel: {
    color: "#EA2B7B",
    fontSize: 12,
    fontWeight: 700,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 700,
  },
  paymentBox: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: "#5A378F",
    backgroundColor: "#5A3691",
    color: "#ffffff",
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 700,
  },
  paymentDetails: {
    width: 210,
  },
  paymentLine: {
    flexDirection: "row",
    fontSize: 8,
    lineHeight: 1.4,
  },
  paymentLineLabel: {
    marginRight: 3,
  },
  paymentLineValue: {
    fontWeight: 700,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
    marginTop: 16,
  },
  footerText: {
    color: "#4b5563",
  },
  footerLogo: {
    width: 160,
    height: 50,
    objectFit: "contain",
  },
});

export function InvoicePdfDocument({ invoice }: InvoicePdfDocumentProps) {
  return createInvoicePdfDocument(invoice);
}

export function createInvoicePdfDocument(
  invoice: Partial<InvoiceFormData & Invoice2FormData>,
) {
  const isInvoice2 = invoice.type === "invoice2";
  const paymentInfo = withPaymentDefaults(invoice.paymentInfo);
  const currency = paymentInfo.currency || "USD";

  return pdfElement(
    Document,
    null,
    pdfElement(
      Page,
      { size: [612, 842], style: styles.page, wrap: true },
      pdfElement(
        View,
        { style: styles.content },
        pdfElement(InvoiceHeader, { invoice }),
        pdfElement(InvoiceTitle, { invoice }),
        pdfElement(InvoiceDates, { invoice }),
        isInvoice2
          ? pdfElement(ServiceTable, {
              services: invoice.services ?? [],
              currency,
            })
          : pdfElement(ItemTable, { items: invoice.items ?? [], currency }),
        pdfElement(TotalsBlock, {
          rows: isInvoice2
            ? buildServiceTotalRows(invoice, currency)
            : buildItemTotalRows(invoice, currency),
          paymentInfo,
        }),
      ),
      pdfElement(InvoiceFooter),
    ),
  );
}

function InvoiceHeader({ invoice }: InvoicePdfDocumentProps) {
  const logoUrl = invoice.logoUrl;
  const to = invoice.to ?? { name: "", email: "", phone: "", address: "" };

  return pdfElement(
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
      { style: styles.clientBlock },
      pdfElement(Text, { style: styles.accentLabel }, "To:"),
      pdfElement(Text, { style: { fontWeight: 700 } }, to.name),
      pdfElement(Text, { style: styles.mutedText }, to.address),
      pdfElement(Text, { style: styles.mutedText }, to.email),
      pdfElement(Text, { style: styles.mutedText }, to.phone),
    ),
  );
}

function InvoiceTitle({ invoice }: InvoicePdfDocumentProps) {
  return pdfElement(
    View,
    { style: styles.titleRow },
    pdfElement(Text, { style: styles.title }, invoice.name || "Invoice"),
    pdfElement(Text, { style: styles.title }, `#${invoice.invoiceNumber || "INV-001"}`),
  );
}

function InvoiceDates({ invoice }: InvoicePdfDocumentProps) {
  return pdfElement(
    View,
    { style: styles.datesRow },
    pdfElement(
      View,
      { style: styles.dateItem },
      pdfElement(Text, { style: styles.dateLabel }, "Invoice Date:"),
      pdfElement(Text, { style: styles.mutedText }, formatDate(invoice.date)),
    ),
    pdfElement(
      View,
      { style: styles.dateItem },
      pdfElement(Text, { style: styles.dateLabel }, "Due Date:"),
      pdfElement(Text, { style: styles.mutedText }, formatDate(invoice.dueDate)),
    ),
  );
}

function ItemTable({
  items,
  currency,
}: {
  items: InvoiceItem[];
  currency: string;
}) {
  return pdfElement(
    View,
    { style: styles.table },
    pdfElement(
      View,
      { style: styles.tableHeader, fixed: true },
      pdfElement(Text, { style: styles.itemColumn }, "Items"),
      pdfElement(Text, { style: styles.numberColumn }, "Quantity"),
      pdfElement(Text, { style: styles.numberColumn }, "Unit Price"),
      pdfElement(Text, { style: styles.numberColumn }, "Amount"),
    ),
    items.length > 0
      ? items.map((item, index) =>
          pdfElement(ItemRow, {
            key: `${item.name}-${index}`,
            item,
            indexLabel: `${index + 1}.`,
            currency,
          }),
        )
      : pdfElement(Text, { style: styles.emptyText }, "No items added"),
  );
}

function ServiceTable({
  services,
  currency,
}: {
  services: ServiceGroup[];
  currency: string;
}) {
  return pdfElement(
    View,
    { style: styles.table },
    pdfElement(
      View,
      { style: styles.tableHeader, fixed: true },
      pdfElement(Text, { style: styles.itemColumn }, "Services & Items"),
      pdfElement(Text, { style: styles.numberColumn }, "Qty"),
      pdfElement(Text, { style: styles.numberColumn }, "Unit Price"),
      pdfElement(Text, { style: styles.numberColumn }, "Amount"),
    ),
    services.length > 0
      ? services.map((service, serviceIndex) =>
          pdfElement(
            View,
            { key: `${service.serviceName}-${serviceIndex}`, wrap: false },
            pdfElement(
              Text,
              { style: styles.serviceHeader },
              `${serviceIndex + 1}. ${service.serviceName || `Service ${serviceIndex + 1}`}`,
            ),
            service.items.map((item, itemIndex) =>
              pdfElement(ItemRow, {
                key: `${item.name}-${itemIndex}`,
                item,
                indexLabel: `${itemIndex + 1}.`,
                currency,
                indented: true,
              }),
            ),
            pdfElement(
              View,
              { style: styles.serviceSubtotalRow },
              pdfElement(Text, { style: styles.serviceSubtotalLabel }, "Service Subtotal:"),
              pdfElement(
                Text,
                { style: styles.serviceSubtotalValue },
                `${currency} ${sumItems(service.items).toFixed(2)}`,
              ),
            ),
          ),
        )
      : pdfElement(Text, { style: styles.emptyText }, "No services added"),
  );
}

function ItemRow({
  item,
  indexLabel,
  currency,
  indented = false,
}: {
  item: InvoiceItem | ServiceItem;
  indexLabel: string;
  currency: string;
  indented?: boolean;
}) {
  return pdfElement(
    View,
    { style: styles.tableRow, wrap: false },
    pdfElement(
      View,
      { style: [styles.itemColumn, indented ? { paddingLeft: 14 } : {}] },
      pdfElement(Text, { style: styles.itemName }, `${indexLabel} ${item.name}`),
      item.note ? pdfElement(Text, { style: styles.itemNote }, item.note) : null,
      item.subItems?.map((subItem, index) =>
        pdfElement(Text, { key: `${subItem}-${index}`, style: styles.subItem }, `- ${subItem}`),
      ),
    ),
    pdfElement(Text, { style: styles.numberColumn }, item.quantity),
    pdfElement(Text, { style: styles.numberColumn }, `${currency} ${formatMoney(item.unitPrice)}`),
    pdfElement(
      Text,
      { style: styles.numberColumn },
      `${currency} ${formatMoney(item.quantity * item.unitPrice)}`,
    ),
  );
}

function TotalsBlock({
  rows,
  paymentInfo,
}: {
  rows: TotalRow[];
  paymentInfo: ReturnType<typeof withPaymentDefaults>;
}) {
  return pdfElement(
    View,
    { style: styles.totals, wrap: false },
    rows.map((row) =>
      pdfElement(
        View,
        { key: row.label, style: styles.totalRow },
        pdfElement(Text, { style: styles.totalLabel }, row.label),
        pdfElement(Text, { style: styles.totalValue }, row.value),
      ),
    ),
    pdfElement(
      View,
      { style: styles.paymentBox },
      pdfElement(
        View,
        { style: styles.paymentRow },
        pdfElement(Text, { style: styles.paymentTitle }, "Payment Information:"),
        pdfElement(
          View,
          { style: styles.paymentDetails },
          pdfElement(PaymentLine, { label: "Account Number:", value: paymentInfo.accountNumber }),
          pdfElement(PaymentLine, { label: "SWIFT Code:", value: paymentInfo.swift }),
          pdfElement(PaymentLine, { label: "Bank Name:", value: paymentInfo.bankName }),
          pdfElement(PaymentLine, { label: "Branch:", value: paymentInfo.branch }),
        ),
      ),
    ),
  );
}

function PaymentLine({ label, value }: { label: string; value: string }) {
  return pdfElement(
    View,
    { style: styles.paymentLine },
    pdfElement(Text, { style: styles.paymentLineLabel }, label),
    pdfElement(Text, { style: styles.paymentLineValue }, value),
  );
}

function InvoiceFooter() {
  return pdfElement(
    View,
    { style: styles.footer, fixed: true },
    pdfElement(
      View,
      { style: styles.footerText },
      pdfElement(Text, null, "+880 1784 398 934"),
      pdfElement(Text, null, "info@jamroll.xyz"),
      pdfElement(Text, null, "www.jamroll.xyz"),
    ),
    pdfElement(Image, { src: jamrollLogoDataUri, style: styles.footerLogo }),
  );
}

function buildItemTotalRows(
  invoice: Partial<InvoiceFormData & Invoice2FormData>,
  currency: string,
): TotalRow[] {
  const subtotal = sumItems(invoice.items ?? []);
  const discount = invoice.discount ?? 0;
  const vat = invoice.vat ?? 0;
  const vatAmount = ((subtotal - discount) * vat) / 100;
  const total = subtotal + vatAmount - discount;

  return buildTotalRows(subtotal, vat, vatAmount, discount, total, currency);
}

function buildServiceTotalRows(
  invoice: Partial<InvoiceFormData & Invoice2FormData>,
  currency: string,
): TotalRow[] {
  const subtotal = (invoice.services ?? []).reduce(
    (total, service) => total + sumItems(service.items),
    0,
  );
  const discount = invoice.discount ?? 0;
  const vat = invoice.vat ?? 0;
  const vatAmount = ((subtotal - discount) * vat) / 100;
  const total = subtotal + vatAmount - discount;

  return buildTotalRows(subtotal, vat, vatAmount, discount, total, currency);
}

function buildTotalRows(
  subtotal: number,
  vat: number,
  vatAmount: number,
  discount: number,
  total: number,
  currency: string,
): TotalRow[] {
  const rows: TotalRow[] = [
    {
      label: "Sub-Total",
      value: `${formatMoney(subtotal)} (${currency})`,
    },
  ];

  if (vat > 0) {
    rows.push({
      label: `VAT (${vat}%)`,
      value: `${formatMoney(vatAmount)} (${currency})`,
    });
  }

  if (discount > 0) {
    rows.push({
      label: "Discount (-)",
      value: `${formatMoney(discount)} (${currency})`,
    });
  }

  rows.push({
    label: "Grand Total",
    value: `${formatMoney(total)} (${currency})`,
  });

  return rows;
}

function sumItems(items: Array<InvoiceItem | ServiceItem>) {
  return items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
}

function withPaymentDefaults(
  paymentInfo: Partial<InvoiceFormData["paymentInfo"]> | undefined,
) {
  return {
    accountName: paymentInfo?.accountName ?? "",
    accountNumber: paymentInfo?.accountNumber ?? "",
    bankName: paymentInfo?.bankName ?? "",
    branch: paymentInfo?.branch ?? "",
    swift: paymentInfo?.swift ?? "",
    currency: paymentInfo?.currency ?? "USD",
  };
}

function formatDate(date: Date | string | undefined) {
  return format(new Date(date ?? Date.now()), "MMM dd, yyyy");
}

function formatMoney(value: number) {
  return Number(value).toFixed(2);
}
