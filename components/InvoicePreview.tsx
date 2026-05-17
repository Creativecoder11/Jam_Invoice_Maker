"use client";

import React, { forwardRef, useMemo } from "react";
import { InvoiceFormData, InvoiceItem } from "@/types/invoice";
import { format } from "date-fns";

type InvoicePreviewProps = {
  data: Partial<InvoiceFormData>;
};

// A4 at 72ppi — matches jsPDF "px" unit format
export const PAGE_WIDTH = 612;
export const PAGE_HEIGHT = 842;

const PADDING = 30;

// Approximate heights for page-split calculation (px)
const BOTTOM_FOOTER_H = 72;
const HEADER_H = 165; // logo + from/to block
const TITLE_H = 60; // INVOICE #001 row
const TABLE_HEADER_H = 32; // thead row (reused on every page)
const FIRST_PAGE_GAP = 32; // spacing between sections on first page
const FOOTER_H = 150; // payment info + totals block

const USABLE_H = PAGE_HEIGHT - PADDING * 2 - BOTTOM_FOOTER_H; // 710px

// How many px items can use on first page (header/title take top space)
const FIRST_PAGE_ITEMS_CAP =
  USABLE_H - HEADER_H - TITLE_H - TABLE_HEADER_H - FIRST_PAGE_GAP;

// Subsequent pages: only table header consumes space above items
const NEXT_PAGE_ITEMS_CAP = USABLE_H - TABLE_HEADER_H;

function estimateItemH(item: InvoiceItem): number {
  let h = 34;
  if (item.note) h += 16;
  if (item.subItems?.length) h += item.subItems.length * 14;
  return h;
}

type PageSlice = {
  items: InvoiceItem[];
  isFirst: boolean;
  isLast: boolean;
};

function buildPages(items: InvoiceItem[]): PageSlice[] {
  if (!items.length) {
    return [{ items: [], isFirst: true, isLast: true }];
  }

  const pages: PageSlice[] = [];
  const queue = [...items];
  let firstPage = true;

  while (queue.length > 0) {
    const cap = firstPage ? FIRST_PAGE_ITEMS_CAP : NEXT_PAGE_ITEMS_CAP;
    const chunk: InvoiceItem[] = [];
    let used = 0;

    while (queue.length > 0) {
      const h = estimateItemH(queue[0]);
      if (used + h > cap && chunk.length > 0) break;
      chunk.push(queue.shift()!);
      used += h;
    }

    pages.push({
      items: chunk,
      isFirst: firstPage,
      isLast: queue.length === 0,
    });
    firstPage = false;
  }

  // Check whether the totals footer fits on the last page alongside its items
  const lp = pages[pages.length - 1];
  const lpCap = lp.isFirst ? FIRST_PAGE_ITEMS_CAP : NEXT_PAGE_ITEMS_CAP;
  const lpUsed = lp.items.reduce((s, item) => s + estimateItemH(item), 0);

  if (lpUsed + FOOTER_H > lpCap) {
    // Footer won't fit — push it to a dedicated trailing page
    lp.isLast = false;
    pages.push({ items: [], isFirst: false, isLast: true });
  }

  return pages;
}

// ── FIX: CSS reset injected before PDF capture ─────────────────────────────
export function injectPdfResetStyle(): HTMLStyleElement {
  const style = document.createElement("style");
  style.setAttribute("data-pdf-reset", "true");
  style.innerHTML = `
    [data-invoice-page] * {
      margin-block-start: 0 !important;
      margin-block-end: 0 !important;
      margin-top: 0 !important;
      margin-bottom: 0 !important;
    }
  `;
  document.head.appendChild(style);
  return style;
}

export function removePdfResetStyle(style: HTMLStyleElement) {
  if (style && document.head.contains(style)) {
    document.head.removeChild(style);
  }
}
// ───────────────────────────────────────────────────────────────────────────

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  ({ data }, ref) => {
    const {
      invoiceNumber = "INV-001",
      name = "Invoice",
      logoUrl,
      from = { name: "", email: "", phone: "", address: "" },
      to = { name: "", email: "", phone: "", address: "" },
      date = new Date(),
      dueDate = new Date(),
      paymentInfo = {
        accountName: "",
        accountNumber: "",
        bankName: "",
        branch: "",
        swift: "",
        currency: "$",
      },
      items = [],
      vat = 0,
      discount = 0,
    } = data;

    const subtotal = items.reduce(
      (acc, item) => acc + item.quantity * item.unitPrice,
      0,
    );
    const vatAmount = ((subtotal - (discount ?? 0)) * (vat ?? 0)) / 100;
    const grandTotal = subtotal + vatAmount - (discount ?? 0);

    const pages = useMemo(() => buildPages(items), [items]);

    // Global item index offset per page (for continuous numbering)
    const startIndices = useMemo(() => {
      let offset = 0;
      return pages.map((p) => {
        const s = offset;
        offset += p.items.length;
        return s;
      });
    }, [pages]);

    return (
      // FIX: added lineHeight: "normal" to outer wrapper
      <div ref={ref} style={{ lineHeight: "normal" }}>
        {pages.map((page, pageIdx) => (
          <div
            key={pageIdx}
            data-invoice-page="true"
            style={{
              width: `${PAGE_WIDTH}px`,
              height: `${PAGE_HEIGHT}px`,
              padding: `${PADDING}px`,
              background: "white",
              color: "black",
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
              marginBottom: pageIdx < pages.length - 1 ? "20px" : 0,
              breakAfter: pageIdx < pages.length - 1 ? "page" : "auto",
              overflow: "hidden",
            }}
          >
            {/* ── CONTENT AREA ─────────────────────────────────── */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              {/* HEADER — first page only */}
              {page.isFirst && (
                <header
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "14px",
                  }}
                >
                  {/* Logo on left, From/To on right */}
                  <div>
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        crossOrigin="anonymous"
                        style={{
                          width: "73px",
                          height: "110px",
                          objectFit: "cover",
                          borderRadius: "4px",
                        }}
                        alt="Logo"
                      />
                    ) : (
                      <div
                        style={{
                          width: "73px",
                          height: "110px",
                          background: "#f3f4f6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                          color: "#9ca3af",
                          borderRadius: "4px",
                        }}
                      >
                        Logo
                      </div>
                    )}
                  </div>
                  {/* From/To block */}
                  <div style={{ textAlign: "left", fontSize: "12px" }}>
                    <div>
                      {/* FIX: margin: 0 on h4 */}
                      <h4
                        style={{
                          color: "#5A378F",
                          fontWeight: "bold",
                          margin: 0,
                        }}
                      >
                        To:
                      </h4>
                      {/* FIX: margin: 0 on all p tags */}
                      <p style={{ fontWeight: "bold", margin: 0 }}>{to.name}</p>
                      <p
                        style={{
                          color: "#4b5563",
                          whiteSpace: "pre-line",
                          margin: 0,
                        }}
                      >
                        {to.address}
                      </p>
                      <p style={{ color: "#4b5563", margin: 0 }}>{to.email}</p>
                      <p style={{ color: "#4b5563", margin: 0 }}>{to.phone}</p>
                    </div>
                  </div>
                </header>
              )}

              {/* Invoice & No */}
              {page.isFirst && (
                <div
                  style={{
                    display: "flex",
                    gap: "24px",
                    fontSize: "20px",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    marginBottom: "14px",
                  }}
                >
                  {/* FIX: margin: 0 on both h1 tags */}
                  <h1
                    style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}
                  >
                    {name}
                  </h1>
                  <h1
                    style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}
                  >
                    #{invoiceNumber}
                  </h1>
                </div>
              )}

              {/* Invoice Date and Due Date */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: "2px",
                }}
              >
                {page.isFirst && (
                  <>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: "4px",
                      }}
                    >
                      {/* FIX: margin: 0 on h4 and p */}
                      <h4
                        style={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          margin: 0,
                        }}
                      >
                        Invoice Date:
                      </h4>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#374151",
                          margin: 0,
                        }}
                      >
                        {format(new Date(date), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: "4px",
                      }}
                    >
                      {/* FIX: margin: 0 on h4 and p */}
                      <h4
                        style={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          margin: 0,
                        }}
                      >
                        Due Date:
                      </h4>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#374151",
                          margin: 0,
                        }}
                      >
                        {format(new Date(dueDate), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* items table */}
              <div
                style={{
                  width: "100%",
                  borderTop: "1px solid #7D7E81",
                  paddingTop: "8px",
                  // FIX: added marginTop to separate from date row
                  marginTop: "14px",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        color: "#5A378F",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      <th
                        style={{
                          textAlign: "left",
                          paddingBottom: "6px",
                          lineHeight: "1",
                          verticalAlign: "middle",
                        }}
                      >
                        Items
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          paddingBottom: "6px",
                          lineHeight: "1",
                          verticalAlign: "middle",
                        }}
                      >
                        Quantity
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          paddingBottom: "6px",
                          lineHeight: "1",
                          verticalAlign: "middle",
                        }}
                      >
                        Unit Price
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          paddingBottom: "6px",
                          lineHeight: "1",
                          verticalAlign: "middle",
                        }}
                      >
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {page.items.length > 0
                      ? page.items.map((item, i) => {
                          const globalIdx = startIndices[pageIdx] + i;
                          return (
                            <tr
                              key={i}
                              style={{ borderTop: "1px solid #e5e7eb" }}
                            >
                              <td
                                style={{
                                  textAlign: "left",
                                  fontSize: "12px",
                                  padding: "7px 0",
                                }}
                              >
                                {/* FIX: use span/div instead of implicit block margin */}
                                <span
                                  style={{
                                    fontWeight: 600,
                                    display: "block",
                                    margin: 0,
                                  }}
                                >
                                  {globalIdx + 1}. {item.name}
                                </span>
                                {item.note && (
                                  <p
                                    style={{
                                      fontSize: "10px",
                                      color: "#6b7280",
                                      margin: 0,
                                      marginTop: "2px",
                                      fontStyle: "italic",
                                    }}
                                  >
                                    {item.note}
                                  </p>
                                )}
                                {item.subItems && item.subItems.length > 0 && (
                                  <ul
                                    style={{
                                      margin: 0,
                                      marginTop: "2px",
                                      padding: 0,
                                      listStyle: "none",
                                    }}
                                  >
                                    {item.subItems.map((sub, si) => (
                                      <li
                                        key={si}
                                        style={{
                                          fontSize: "10px",
                                          color: "#4b5563",
                                          margin: 0,
                                        }}
                                      >
                                        - {sub}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </td>
                              <td
                                style={{
                                  textAlign: "center",
                                  padding: "7px 0",
                                  fontSize: "12px",
                                  verticalAlign: "top",
                                }}
                              >
                                {paymentInfo.currency}
                                {item.unitPrice}
                              </td>
                              <td
                                style={{
                                  textAlign: "center",
                                  padding: "7px 0",
                                  fontSize: "12px",
                                  verticalAlign: "top",
                                }}
                              >
                                {item.quantity}
                              </td>
                              <td
                                style={{
                                  textAlign: "center",
                                  padding: "7px 0",
                                  fontSize: "12px",
                                  verticalAlign: "top",
                                  lineHeight: 1,
                                }}
                              >
                                {paymentInfo.currency}
                                {(item.quantity * item.unitPrice).toFixed(2)}
                              </td>
                            </tr>
                          );
                        })
                      : page.isLast &&
                        items.length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              style={{
                                textAlign: "center",
                                padding: "24px 0",
                                color: "#9ca3af",
                                fontSize: "14px",
                              }}
                            >
                              No items added
                            </td>
                          </tr>
                        )}
                  </tbody>
                </table>
              </div>

              {/* FOOTER (payment + totals) — last page only */}
              {page.isLast && (
                <div style={{ marginTop: "8px" }}>
                  {/* Totals */}
                  <div style={{ width: "100%" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "5.5px",
                        fontSize: "10px",
                      }}
                    >
                      <div style={{ borderTop: "1px solid #B1B1B1" }} />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "12px",
                          fontWeight: "bold",
                          // marginTop: "8px",
                        }}
                      >
                        {/* FIX: margin: 0 on all h2 tags */}
                        <h2
                          style={{
                            color: "#EA2B7B",
                            margin: 0,
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                        >
                          Sub-Total
                        </h2>
                        <h2
                          style={{
                            margin: 0,
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                        >
                          {subtotal.toFixed(2)} ({paymentInfo.currency})
                        </h2>
                      </div>

                      {(vat ?? 0) > 0 && (
                        <>
                          <div style={{ borderTop: "1px solid #B1B1B1" }} />
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            <h2
                              style={{
                                color: "#EA2B7B",
                                margin: 0,
                                fontSize: "12px",
                                fontWeight: "bold",
                              }}
                            >
                              VAT ({vat}%)
                            </h2>
                            <h2
                              style={{
                                margin: 0,
                                fontSize: "12px",
                                fontWeight: "bold",
                              }}
                            >
                              {vatAmount.toFixed(2)} ({paymentInfo.currency})
                            </h2>
                          </div>
                        </>
                      )}

                      {(discount ?? 0) > 0 && (
                        <>
                          <div style={{ borderTop: "1px solid #B1B1B1" }} />
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            <h2
                              style={{
                                color: "#EA2B7B",
                                margin: 0,
                                fontSize: "12px",
                                fontWeight: "bold",
                              }}
                            >
                              Discount (-)
                            </h2>
                            <h2
                              style={{
                                margin: 0,
                                fontSize: "12px",
                                fontWeight: "bold",
                              }}
                            >
                              {Number(discount).toFixed(2)} (
                              {paymentInfo.currency})
                            </h2>
                          </div>
                        </>
                      )}

                      <div style={{ borderTop: "1px solid #B1B1B1" }} />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        <h2
                          style={{
                            color: "#EA2B7B",
                            margin: 0,
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                        >
                          Grand Total
                        </h2>
                        <h2
                          style={{
                            margin: 0,
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                        >
                          {Number(grandTotal).toFixed(2)} (
                          {paymentInfo.currency})
                        </h2>
                      </div>
                    </div>
                  </div>

                  {/* Payment info box */}
                  <div style={{ width: "100%" }}>
                    <div
                      style={{
                        width: "100%",
                        color: "white",
                        padding: "10px 32px 10px 32px",
                        border: "1px solid #5A378F",
                        backgroundColor: "#5A3691",
                        // display: "flex",
                        // flexDirection: "row",
                        // alignItems: "center",
                        // justifyContent: "space-between",
                        gap: "8px",
                        marginTop: "8px",
                        // boxSizing: "border-box",
                        verticalAlign: "top"
                      }}
                    >
                      {/* FIX: margin: 0 on h3 */}
                      <div
                        style={{
                          // paddingBottom: "8px",
                          display: "flex",
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              fontSize: "16px",
                              fontWeight: "bold",
                              margin: 0,
                            }}
                          >
                            Payment Information:
                          </h3>
                        </div>
                        <div style={{ textAlign: "left", fontSize: "10px" }}>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              gap: "4px",
                            }}
                          >
                            {/* FIX: margin: 0 on all p and h4 inside payment info */}
                            <p
                              style={{
                                fontSize: "8px",
                                color: "white",
                                margin: 0,
                              }}
                            >
                              Account Number:
                            </p>
                            <h4
                              style={{
                                fontSize: "8px",
                                fontWeight: "bold",
                                margin: 0,
                              }}
                            >
                              {paymentInfo.accountNumber}
                            </h4>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              gap: "4px",
                            }}
                          >
                            <p
                              style={{
                                fontSize: "8px",
                                color: "white",
                                margin: 0,
                              }}
                            >
                              SWIFT Code:
                            </p>
                            <h4
                              style={{
                                fontSize: "8px",
                                fontWeight: "bold",
                                margin: 0,
                              }}
                            >
                              {paymentInfo.swift}
                            </h4>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              gap: "4px",
                            }}
                          >
                            <p
                              style={{
                                fontSize: "8px",
                                color: "white",
                                margin: 0,
                              }}
                            >
                              Bank Name:
                            </p>
                            <h4
                              style={{
                                fontSize: "8px",
                                fontWeight: "bold",
                                margin: 0,
                              }}
                            >
                              {paymentInfo.bankName}
                            </h4>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              gap: "4px",
                            }}
                          >
                            <p
                              style={{
                                fontSize: "8px",
                                color: "white",
                                margin: 0,
                              }}
                            >
                              Branch:
                            </p>
                            <h4
                              style={{
                                fontSize: "8px",
                                fontWeight: "bold",
                                margin: 0,
                              }}
                            >
                              {paymentInfo.branch}
                            </h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── BOTTOM FOOTER — pinned to bottom of every page ─── Done */}
            <div
              style={{
                borderTop: "1px solid #e5e7eb",
                paddingTop: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#4b5563",
                  marginTop: "-4px",
                  // borderLeft: "1px solid #EA2B7B",
                  // paddingLeft: "28px",
                }}
              >
                {/* FIX: margin: 0 on footer p tags */}
                <p style={{ margin: 0 }}>+880 1784 398 934</p>
                <p style={{ margin: 0 }}>info@jamroll.xyz</p>
                <p style={{ margin: 0 }}>www.jamroll.xyz</p>
              </div>
              <div>
                <img
                  src="/assets/Jamroll Logo.png"
                  alt="Jamroll Logo"
                  width={160}
                  height={50}
                  style={{ objectFit: "cover" }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  },
);

InvoicePreview.displayName = "InvoicePreview";
