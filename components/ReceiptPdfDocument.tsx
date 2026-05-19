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
import { InvoiceFormData, ReceiptInfo } from "@/types/invoice";
import type { ReactElement, ReactNode } from "react";
import { numberToWords } from "@/lib/numberToWords";

const publicPath = path.join(process.cwd(), "public");

type NodeRuntimeGlobal = typeof globalThis & { require?: NodeRequire };
declare const __non_webpack_require__: NodeRequire | undefined;

function loadReactForPdfRenderer() {
  const g = globalThis as NodeRuntimeGlobal;
  const r =
    typeof __non_webpack_require__ === "function" ? __non_webpack_require__ : g.require;
  if (!r) throw new Error("PDF renderer could not load the Node React runtime");
  return r("react") as typeof import("react");
}
const { createElement } = loadReactForPdfRenderer();

function el(type: any, props?: any, ...children: ReactNode[]): ReactElement {
  return createElement(type, props, ...children) as ReactElement;
}

Font.register({
  family: "HelveticaNowDisplay",
  fonts: [
    { src: path.join(publicPath, "fonts", "HelveticaNowDisplay-Regular.ttf"), fontWeight: 400 },
    { src: path.join(publicPath, "fonts", "HelveticaNowDisplay-Medium.ttf"),  fontWeight: 500 },
    { src: path.join(publicPath, "fonts", "HelveticaNowDisplay-Bold.ttf"),    fontWeight: 700 },
  ],
});

const jamrollLogoUri = `data:image/png;base64,${readFileSync(path.join(publicPath, "assets", "Jamroll Logo.png")).toString("base64")}`;

const PURPLE = "#5A378F";

const s = StyleSheet.create({
  page:         { width: 612, minHeight: 842, padding: 30, backgroundColor: "#fff", fontFamily: "HelveticaNowDisplay", fontSize: 11 },
  content:      { flexGrow: 1 },

  // header
  headerRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  logo:         { width: 72, height: 72, objectFit: "contain" },
  logoBox:      { width: 72, height: 72, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center", borderRadius: 4 },
  logoText:     { fontSize: 9, color: "#9ca3af" },
  companyBlock: { alignItems: "flex-end" },
  companyName:  { fontWeight: 700, fontSize: 12, color: PURPLE },
  companyInfo:  { fontSize: 10, color: "#374151", textAlign: "right" },

  // title — centred to match preview
  titleText:    { fontSize: 20, fontWeight: 700, letterSpacing: 2, textAlign: "center", color: "#1a1a1a", marginBottom: 8 },
  hr:           { borderTopWidth: 1, borderTopColor: "#1a1a1a", marginBottom: 8 },
  hrLight:      { borderTopWidth: 1, borderTopColor: "#9ca3af", marginBottom: 0 },

  // bill to
  billRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, marginTop: 8 },
  billLabel:    { fontWeight: 700, fontSize: 11, color: PURPLE, marginBottom: 4 },
  billName:     { fontWeight: 700, fontSize: 12 },
  billInfo:     { fontSize: 10, color: "#374151" },
  invRow:       { flexDirection: "row", justifyContent: "flex-end", gap: 4, marginBottom: 4 },
  invLabel:     { fontWeight: 700, fontSize: 11, color: PURPLE },
  invValue:     { fontWeight: 700, fontSize: 11 },

  // table
  thCell:       { padding: "7 8", fontWeight: 700, fontSize: 10, backgroundColor: PURPLE, color: "#fff", borderWidth: 1, borderColor: PURPLE },
  thRight:      { textAlign: "center" },
  tdCell:       { padding: "6 8", fontSize: 11, borderWidth: 1, borderColor: "#e5e7eb" },
  tdRight:      { textAlign: "center" },
  tdBold:       { fontWeight: 700 },
  tdGray:       { backgroundColor: "#f9fafb" },
  tableRow:     { flexDirection: "row" },

  // words
  wordsBox:     { marginTop: 12, fontSize: 11, flexDirection: "row", flexWrap: "wrap" },
  wordsLabel:   { fontWeight: 700, color: PURPLE },
  wordsText:    { fontWeight: 700 },

  // payment received in — horizontal row matching preview
  paySection:   { marginTop: 14 },
  sectionTitle: { fontWeight: 700, fontSize: 11, color: PURPLE, textDecoration: "underline", marginBottom: 8 },
  pmInline:     { flexDirection: "row", alignItems: "center", gap: 14, flexWrap: "wrap" },
  pmItem:       { flexDirection: "row", alignItems: "center", gap: 5 },
  pmLabel:      { fontWeight: 700, fontSize: 11, color: PURPLE },
  cbChecked:    { width: 15, height: 15, backgroundColor: PURPLE, borderRadius: 2, alignItems: "center", justifyContent: "center" },
  // Checkmark drawn with border-strokes (L-shape rotated) — avoids missing font glyph
  cbShape:      { width: 7, height: 4, borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderColor: "#fff", transform: "rotate(-45deg)", marginBottom: 2 },
  cbDash:       { color: "#9ca3af", fontSize: 12, fontWeight: 700, width: 15, textAlign: "center" },

  divider:      { borderTopWidth: 1, borderTopColor: "#9ca3af", marginVertical: 12 },

  // received by
  receivedTitle: { fontWeight: 700, fontSize: 11, color: PURPLE, textDecoration: "underline", marginBottom: 8 },
  receivedText:  { fontSize: 11, lineHeight: 1.7 },
  receivedBold:  { fontWeight: 700 },

  // footer
  footer:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 8, marginTop: 16 },
  footerText:   { color: "#4b5563", fontSize: 10 },
  footerLogo:   { width: 130, height: 40, objectFit: "contain" },
});

const defaultRI = (): ReceiptInfo => ({
  currency: "BDT", showInvoiceNo: true, lineItems: [],
  paidAmount: 0, receivedAmount: 0, paymentMethod: "", accountTransferName: "",
  receivedBy: { name: "", designation: "", companyName: "", address: "", mobile: "" },
});

export function createReceiptPdfDocument(receipt: Partial<InvoiceFormData>) {
  const {
    invoiceNumber = "",
    logoUrl,
    from = { name: "", email: "", phone: "", address: "" },
    to   = { name: "", email: "", phone: "", address: "" },
    date = new Date(),
    receiptInfo: ri = defaultRI(),
  } = receipt;

  const currency       = ri.currency || "BDT";
  const showInvCol     = ri.showInvoiceNo !== false;
  const totalDue       = (ri.lineItems || []).reduce((s, i) => s + (i.amount || 0), 0);
  const paid           = ri.paidAmount     || 0;
  const received       = ri.receivedAmount || 0;
  const currentDue     = totalDue - paid - received;
  const words          = numberToWords(Math.abs(currentDue), currency);

  const invColW = showInvCol ? "26%" : "0%";
  const amtColW = "22%";

  // payment method options — same order as preview
  const pmOptions = [
    { key: "cash"            as const, label: "Cash" },
    { key: "cheque"          as const, label: "Cheque" },
    { key: "accountTransfer" as const, label: "Acc. Transfer" },
  ];

  return el(
    Document, null,
    el(Page, { size: [612, 842], style: s.page, wrap: true },
      el(View, { style: s.content },

        // ── Header ──────────────────────────────────────────────────────
        el(View, { style: s.headerRow },
          logoUrl
            ? el(Image, { src: logoUrl, style: s.logo })
            : el(View, { style: s.logoBox }, el(Text, { style: s.logoText }, "Logo")),
          el(View, { style: s.companyBlock },
            el(Text, { style: s.companyName }, from.name || ""),
            from.address ? el(Text, { style: s.companyInfo }, from.address) : null,
            from.phone   ? el(Text, { style: s.companyInfo }, from.phone)   : null,
            from.email   ? el(Text, { style: s.companyInfo }, from.email)   : null,
          ),
        ),

        // ── Title (centred) ─────────────────────────────────────────────
        el(Text, { style: s.titleText }, "PAYMENT RECEIPT"),
        el(View, { style: s.hr }),

        // ── Bill To + Invoice No / Date ─────────────────────────────────
        el(View, { style: s.billRow },
          el(View, {},
            el(Text, { style: s.billLabel }, "BILL TO:"),
            el(Text, { style: s.billName  }, to.name || ""),
            to.address ? el(Text, { style: s.billInfo }, to.address) : null,
            to.phone   ? el(Text, { style: s.billInfo }, `M: ${to.phone}`) : null,
            to.email   ? el(Text, { style: s.billInfo }, to.email)   : null,
          ),
          el(View, { style: { alignItems: "flex-end" } },
            el(View, { style: s.invRow },
              el(Text, { style: s.invLabel }, "INVOICE NO :"),
              el(Text, { style: s.invValue }, invoiceNumber || "—"),
            ),
            el(View, { style: s.invRow },
              el(Text, { style: s.invLabel }, "DATE :"),
              el(Text, { style: s.invValue }, format(new Date(date), "dd/MM/yyyy")),
            ),
          ),
        ),

        el(View, { style: s.hrLight }),

        // ── Table: column headers (no PURPOSE row — matches preview) ────
        el(View, { style: s.tableRow },
          showInvCol
            ? el(View, { style: [s.thCell, { width: invColW }] }, el(Text, {}, "INVOICE NO"))
            : null,
          el(View, { style: [s.thCell, { flex: 1 }] }, el(Text, {}, "DESCRIPTION")),
          el(View, { style: [s.thCell, s.thRight, { width: amtColW }] }, el(Text, {}, "DUE AMOUNT")),
        ),

        // ── Table: data rows ────────────────────────────────────────────
        ...(ri.lineItems || []).length > 0
          ? (ri.lineItems || []).map((item, idx) =>
              el(View, { key: String(idx), style: [s.tableRow, idx % 2 !== 0 ? s.tdGray : {}] },
                showInvCol
                  ? el(View, { style: [s.tdCell, { width: invColW }] }, el(Text, {}, item.invoiceNo || "—"))
                  : null,
                el(View, { style: [s.tdCell, { flex: 1 }] }, el(Text, {}, item.description)),
                el(View, { style: [s.tdCell, s.tdRight, { width: amtColW }] },
                  el(Text, {}, item.amount.toLocaleString()),
                ),
              ),
            )
          : [el(View, { key: "empty", style: s.tableRow },
              el(View, { style: [s.tdCell, { flex: 1, textAlign: "center", color: "#9ca3af" }] },
                el(Text, {}, "No items added"),
              ),
            )],

        // ── Table: summary rows ─────────────────────────────────────────
        el(View, { style: [s.tableRow, s.tdGray] },
          el(View, { style: [s.tdCell, s.tdBold, { flex: 1 }] },
            el(Text, {}, `TOTAL DUE AMOUNT (${currency})`),
          ),
          el(View, { style: [s.tdCell, s.tdBold, s.tdRight, { width: amtColW }] },
            el(Text, {}, totalDue.toLocaleString()),
          ),
        ),
        // Advance Amount row — only when > 0
        paid > 0
          ? el(View, { style: [s.tableRow, s.tdGray] },
              el(View, { style: [s.tdCell, s.tdBold, { flex: 1 }] },
                el(Text, {}, `ADVANCE AMOUNT (${currency})`),
              ),
              el(View, { style: [s.tdCell, s.tdBold, s.tdRight, { width: amtColW }] },
                el(Text, {}, paid.toLocaleString()),
              ),
            )
          : null,
        // Paid Amount row — only when > 0
        received > 0
          ? el(View, { style: [s.tableRow, s.tdGray] },
              el(View, { style: [s.tdCell, s.tdBold, { flex: 1 }] },
                el(Text, {}, `PAID AMOUNT (${currency})`),
              ),
              el(View, { style: [s.tdCell, s.tdBold, s.tdRight, { width: amtColW }] },
                el(Text, {}, received.toLocaleString()),
              ),
            )
          : null,
        // Current Due row (always shown)
        el(View, { style: [s.tableRow, s.tdGray] },
          el(View, { style: [s.tdCell, s.tdBold, { flex: 1, color: PURPLE }] },
            el(Text, {}, `CURRENT DUE AMOUNT (${currency})`),
          ),
          el(View, { style: [s.tdCell, s.tdBold, s.tdRight, { width: amtColW, color: PURPLE }] },
            el(Text, {}, currentDue.toLocaleString()),
          ),
        ),

        // ── Due in words (before payment section — matches preview) ─────
        el(View, { style: s.wordsBox },
          el(Text, { style: s.wordsLabel }, "Due Payment In Words: "),
          el(Text, { style: s.wordsText  }, words),
        ),

        // ── Payment Received In (horizontal row — matches preview) ──────
        el(View, { style: s.paySection },
          el(Text, { style: s.sectionTitle }, "PAYMENT RECEIVED IN :"),
          el(View, { style: s.pmInline },
            ...pmOptions.map(({ key, label }) => {
              const isChecked  = ri.paymentMethod === key;
              const extraLabel = isChecked && key === "accountTransfer" && ri.accountTransferName
                ? ` (${ri.accountTransferName})`
                : "";
              return el(View, { key, style: s.pmItem },
                el(Text, { style: s.pmLabel }, label + extraLabel),
                isChecked
                  ? el(View, { style: s.cbChecked }, el(View, { style: s.cbShape }))
                  : el(Text, { style: s.cbDash }, "—"),
              );
            }),
          ),
        ),

        // ── Divider ─────────────────────────────────────────────────────
        el(View, { style: s.divider }),

        // ── Received By (no date line — matches preview) ────────────────
        el(Text, { style: s.receivedTitle }, "RECEIVED BY :"),
        ri.receivedBy.name        ? el(Text, { style: [s.receivedText, s.receivedBold] }, ri.receivedBy.name)        : null,
        ri.receivedBy.designation ? el(Text, { style: s.receivedText }, ri.receivedBy.designation)                   : null,
        ri.receivedBy.companyName ? el(Text, { style: s.receivedText }, ri.receivedBy.companyName)                   : null,
        ri.receivedBy.address     ? el(Text, { style: s.receivedText }, ri.receivedBy.address)                       : null,
        ri.receivedBy.mobile      ? el(Text, { style: s.receivedText }, `M: ${ri.receivedBy.mobile}`)                : null,
      ),

      // ── Footer (fixed at bottom of every page) ───────────────────────
      el(View, { style: s.footer, fixed: true },
        el(View, { style: s.footerText },
          el(Text, {}, "+880 1784 398 934"),
          el(Text, {}, "info@jamroll.xyz"),
          el(Text, {}, "www.jamroll.xyz"),
        ),
        el(Image, { src: jamrollLogoUri, style: s.footerLogo }),
      ),
    ),
  );
}
