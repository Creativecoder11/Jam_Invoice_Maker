"use client";

import React, { forwardRef, useMemo } from "react";
import { InvoiceFormData, InvoiceItem } from "@/types/invoice";
import { format } from "date-fns";

type ReceiptPreviewProps = {
  data: Partial<InvoiceFormData>;
};

export const PAGE_WIDTH_R = 612;
export const PAGE_HEIGHT_R = 842;

const PADDING = 30;
const BOTTOM_FOOTER_H = 72;
const HEADER_H = 150;
const TITLE_H = 56;
const TABLE_HEADER_H = 32;
const FIRST_PAGE_GAP = 24;
const FOOTER_H = 160;

const USABLE_H = PAGE_HEIGHT_R - PADDING * 2 - BOTTOM_FOOTER_H;
const FIRST_PAGE_ITEMS_CAP = USABLE_H - HEADER_H - TITLE_H - TABLE_HEADER_H - FIRST_PAGE_GAP;
const NEXT_PAGE_ITEMS_CAP  = USABLE_H - TABLE_HEADER_H;

function estimateItemH(item: InvoiceItem): number {
  let h = 34;
  if (item.note) h += 16;
  if (item.subItems?.length) h += item.subItems.length * 14;
  return h;
}

type PageSlice = { items: InvoiceItem[]; isFirst: boolean; isLast: boolean };

function buildPages(items: InvoiceItem[]): PageSlice[] {
  if (!items.length) return [{ items: [], isFirst: true, isLast: true }];

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
    pages.push({ items: chunk, isFirst: firstPage, isLast: queue.length === 0 });
    firstPage = false;
  }

  const lp = pages[pages.length - 1];
  const lpCap  = lp.isFirst ? FIRST_PAGE_ITEMS_CAP : NEXT_PAGE_ITEMS_CAP;
  const lpUsed = lp.items.reduce((s, i) => s + estimateItemH(i), 0);
  if (lpUsed + FOOTER_H > lpCap) {
    lp.isLast = false;
    pages.push({ items: [], isFirst: false, isLast: true });
  }

  return pages;
}

const STATUS_COLOR: Record<string, string> = {
  Paid:      "#16a34a",
  Unpaid:    "#7c3aed",
  Hold:      "#d97706",
  Cancelled: "#dc2626",
};

export const ReceiptPreview = forwardRef<HTMLDivElement, ReceiptPreviewProps>(
  ({ data }, ref) => {
    const {
      invoiceNumber = "REC-001",
      name          = "Receipt",
      logoUrl,
      from          = { name: "", email: "", phone: "", address: "" },
      to            = { name: "", email: "", phone: "", address: "" },
      date          = new Date(),
      paymentInfo   = { accountName: "", accountNumber: "", bankName: "", branch: "", swift: "", currency: "USD" },
      items         = [],
      vat           = 0,
      discount      = 0,
      status        = "Paid",
    } = data;

    const currency = paymentInfo.currency || "USD";

    const subtotal   = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const vatAmount  = ((subtotal - (discount ?? 0)) * (vat ?? 0)) / 100;
    const grandTotal = subtotal + vatAmount - (discount ?? 0);

    const pages = useMemo(() => buildPages(items), [items]);

    const startIndices = useMemo(() => {
      let offset = 0;
      return pages.map((p) => { const s = offset; offset += p.items.length; return s; });
    }, [pages]);

    const statusColor = STATUS_COLOR[status] ?? "#6b7280";

    return (
      <div ref={ref}>
        {pages.map((page, pageIdx) => (
          <div
            key={pageIdx}
            data-invoice-page="true"
            style={{
              width: `${PAGE_WIDTH_R}px`,
              height: `${PAGE_HEIGHT_R}px`,
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
            <div style={{ flex: 1, overflow: "hidden" }}>

              {/* HEADER */}
              {page.isFirst && (
                <header style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                  {/* Logo */}
                  <div>
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        crossOrigin="anonymous"
                        style={{ width: "73px", height: "100px", objectFit: "cover", borderRadius: "4px" }}
                        alt="Logo"
                      />
                    ) : (
                      <div style={{
                        width: "73px", height: "100px", background: "#f3f4f6",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "10px", color: "#9ca3af", borderRadius: "4px",
                      }}>Logo</div>
                    )}
                  </div>

                  {/* From / To */}
                  <div style={{ textAlign: "right", fontSize: "11px" }}>
                    <div style={{ marginBottom: "8px" }}>
                      <p style={{ fontWeight: "bold", margin: 0, fontSize: "12px", color: "#5A378F" }}>Issued by:</p>
                      <p style={{ fontWeight: "bold", margin: 0 }}>{from.name}</p>
                      <p style={{ color: "#4b5563", margin: 0 }}>{from.email}</p>
                      <p style={{ color: "#4b5563", margin: 0 }}>{from.phone}</p>
                    </div>
                    <div>
                      <p style={{ fontWeight: "bold", margin: 0, fontSize: "12px", color: "#5A378F" }}>Issued to:</p>
                      <p style={{ fontWeight: "bold", margin: 0 }}>{to.name}</p>
                      <p style={{ color: "#4b5563", whiteSpace: "pre-line", margin: 0 }}>{to.address}</p>
                      <p style={{ color: "#4b5563", margin: 0 }}>{to.email}</p>
                      <p style={{ color: "#4b5563", margin: 0 }}>{to.phone}</p>
                    </div>
                  </div>
                </header>
              )}

              {/* Title row */}
              {page.isFirst && (
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginBottom: "14px",
                }}>
                  <div>
                    <h1 style={{
                      margin: 0, fontSize: "26px", fontWeight: "bold",
                      textTransform: "uppercase", letterSpacing: "2px",
                      color: "#1e1e2e",
                    }}>
                      {name}
                    </h1>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6b7280" }}>
                      #{invoiceNumber}
                    </p>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end", marginBottom: "4px" }}>
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>Date:</span>
                      <span style={{ fontSize: "12px", fontWeight: "bold" }}>
                        {format(new Date(date), "MMM dd, yyyy")}
                      </span>
                    </div>
                    {/* Status pill */}
                    <span style={{
                      display: "inline-block",
                      padding: "2px 10px",
                      borderRadius: "999px",
                      fontSize: "10px",
                      fontWeight: "bold",
                      color: "white",
                      backgroundColor: statusColor,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}>
                      {status}
                    </span>
                  </div>
                </div>
              )}

              {/* Items table */}
              <div style={{
                width: "100%",
                borderTop: "2px solid #5A378F",
                paddingTop: "8px",
                marginTop: page.isFirst ? "0" : "0",
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ color: "#5A378F", fontSize: "11px", fontWeight: "bold" }}>
                      <th style={{ textAlign: "left", paddingBottom: "6px", paddingRight: "8px" }}>Description</th>
                      <th style={{ textAlign: "center", paddingBottom: "6px", width: "60px" }}>Qty</th>
                      <th style={{ textAlign: "center", paddingBottom: "6px", width: "90px" }}>Unit Price</th>
                      <th style={{ textAlign: "right",  paddingBottom: "6px", width: "90px" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {page.items.length > 0
                      ? page.items.map((item, i) => {
                          const globalIdx = startIndices[pageIdx] + i;
                          return (
                            <tr key={i} style={{ borderTop: "1px solid #e5e7eb" }}>
                              <td style={{ textAlign: "left", fontSize: "12px", padding: "7px 8px 7px 0" }}>
                                <span style={{ fontWeight: 600, display: "block", margin: 0 }}>
                                  {globalIdx + 1}. {item.name}
                                </span>
                                {item.note && (
                                  <p style={{ fontSize: "10px", color: "#6b7280", margin: "2px 0 0", fontStyle: "italic" }}>
                                    {item.note}
                                  </p>
                                )}
                                {item.subItems && item.subItems.length > 0 && (
                                  <ul style={{ margin: "2px 0 0", padding: 0, listStyle: "none" }}>
                                    {item.subItems.map((sub, si) => (
                                      <li key={si} style={{ fontSize: "10px", color: "#4b5563", margin: 0 }}>
                                        — {sub}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </td>
                              <td style={{ textAlign: "center", padding: "7px 0", fontSize: "12px", verticalAlign: "top" }}>
                                {item.quantity}
                              </td>
                              <td style={{ textAlign: "center", padding: "7px 0", fontSize: "12px", verticalAlign: "top" }}>
                                {currency} {item.unitPrice.toFixed(2)}
                              </td>
                              <td style={{ textAlign: "right", padding: "7px 0", fontSize: "12px", verticalAlign: "top", fontWeight: 600 }}>
                                {currency} {(item.quantity * item.unitPrice).toFixed(2)}
                              </td>
                            </tr>
                          );
                        })
                      : page.isLast && items.length === 0 && (
                          <tr>
                            <td colSpan={4} style={{ textAlign: "center", padding: "24px 0", color: "#9ca3af", fontSize: "14px" }}>
                              No items added
                            </td>
                          </tr>
                        )}
                  </tbody>
                </table>
              </div>

              {/* FOOTER — last page only */}
              {page.isLast && (
                <div style={{ marginTop: "16px" }}>

                  {/* Totals */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ width: "260px" }}>
                      <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "5px" }}>
                          <span style={{ color: "#6b7280" }}>Sub-Total</span>
                          <span style={{ fontWeight: 600 }}>{currency} {subtotal.toFixed(2)}</span>
                        </div>

                        {(vat ?? 0) > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "5px" }}>
                            <span style={{ color: "#6b7280" }}>VAT ({vat}%)</span>
                            <span style={{ fontWeight: 600 }}>{currency} {vatAmount.toFixed(2)}</span>
                          </div>
                        )}

                        {(discount ?? 0) > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "5px" }}>
                            <span style={{ color: "#6b7280" }}>Discount</span>
                            <span style={{ fontWeight: 600 }}>- {currency} {Number(discount).toFixed(2)}</span>
                          </div>
                        )}

                        <div style={{
                          display: "flex", justifyContent: "space-between",
                          borderTop: "2px solid #5A378F", marginTop: "6px", paddingTop: "6px",
                          fontSize: "14px", fontWeight: "bold",
                        }}>
                          <span style={{ color: "#5A378F" }}>TOTAL</span>
                          <span style={{ color: "#5A378F" }}>{currency} {grandTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment info */}
                  <div style={{
                    marginTop: "16px",
                    background: "#5A3691",
                    borderRadius: "6px",
                    padding: "12px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    color: "white",
                  }}>
                    <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>Payment Information</h3>
                    <div style={{ fontSize: "9px", textAlign: "left", lineHeight: "1.7" }}>
                      {paymentInfo.accountNumber && (
                        <div><span style={{ color: "#c4b5fd" }}>Account: </span><strong>{paymentInfo.accountNumber}</strong></div>
                      )}
                      {paymentInfo.swift && (
                        <div><span style={{ color: "#c4b5fd" }}>SWIFT: </span><strong>{paymentInfo.swift}</strong></div>
                      )}
                      {paymentInfo.bankName && (
                        <div><span style={{ color: "#c4b5fd" }}>Bank: </span><strong>{paymentInfo.bankName}</strong></div>
                      )}
                      {paymentInfo.branch && (
                        <div><span style={{ color: "#c4b5fd" }}>Branch: </span><strong>{paymentInfo.branch}</strong></div>
                      )}
                    </div>
                  </div>

                  {/* Thank you note */}
                  <p style={{
                    marginTop: "12px",
                    textAlign: "center",
                    fontSize: "11px",
                    color: "#9ca3af",
                    fontStyle: "italic",
                  }}>
                    Thank you for your business!
                  </p>
                </div>
              )}
            </div>

            {/* Bottom footer — every page */}
            <div style={{
              borderTop: "1px solid #e5e7eb",
              paddingTop: "10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              flexShrink: 0,
            }}>
              <div style={{ fontSize: "11px", color: "#4b5563" }}>
                <p style={{ margin: 0 }}>+880 1784 398 934</p>
                <p style={{ margin: 0 }}>info@jamroll.xyz</p>
                <p style={{ margin: 0 }}>www.jamroll.xyz</p>
              </div>
              <div>
                <img
                  src="/assets/Jamroll Logo.png"
                  alt="Jamroll Logo"
                  width={140}
                  height={44}
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

ReceiptPreview.displayName = "ReceiptPreview";
