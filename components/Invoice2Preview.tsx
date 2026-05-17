"use client";

import React, { forwardRef, useMemo } from "react";
import { format } from "date-fns";
import { Invoice2FormData, ServiceGroup, ServiceItem } from "@/types/invoice";

type Invoice2PreviewProps = {
  data: Partial<Invoice2FormData>;
};

export const PAGE_WIDTH_2 = 612;
export const PAGE_HEIGHT_2 = 842;

const PADDING = 30;
const BOTTOM_FOOTER_H = 72;
const HEADER_H = 165;
const TITLE_H = 60;
const TABLE_HEADER_H = 32;
const FIRST_PAGE_GAP = 24;
const FOOTER_H = 160;
const USABLE_H = PAGE_HEIGHT_2 - PADDING * 2 - BOTTOM_FOOTER_H;
const FIRST_PAGE_ITEMS_CAP =
  USABLE_H - HEADER_H - TITLE_H - TABLE_HEADER_H - FIRST_PAGE_GAP;
const NEXT_PAGE_ITEMS_CAP = USABLE_H - TABLE_HEADER_H;

// ── Flat row types for pagination ─────────────────────────────────────────────
type ServiceHeaderRow = { type: "service-header"; name: string; idx: number };
type ServiceItemRow = {
  type: "item";
  item: ServiceItem;
  serviceIdx: number;
  itemIdx: number;
};
type SubtotalRow = { type: "subtotal"; amount: number; currency: string };
type FlatRow = ServiceHeaderRow | ServiceItemRow | SubtotalRow;

function estimateFlatRowH(row: FlatRow): number {
  if (row.type === "service-header") return 30;
  if (row.type === "subtotal") return 26;
  let h = 34;
  if (row.item.note) h += 16;
  if (row.item.subItems?.length) h += row.item.subItems.length * 14;
  return h;
}

function flattenServices(
  services: ServiceGroup[],
  currency: string,
): FlatRow[] {
  const rows: FlatRow[] = [];
  services.forEach((svc, si) => {
    rows.push({
      type: "service-header",
      name: svc.serviceName || `Service ${si + 1}`,
      idx: si,
    });
    svc.items.forEach((item, ii) => {
      rows.push({ type: "item", item, serviceIdx: si, itemIdx: ii });
    });
    const sub = svc.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    rows.push({ type: "subtotal", amount: sub, currency });
  });
  return rows;
}

type PageSlice2 = { rows: FlatRow[]; isFirst: boolean; isLast: boolean };

function buildPages2(rows: FlatRow[]): PageSlice2[] {
  if (!rows.length) return [{ rows: [], isFirst: true, isLast: true }];

  const pages: PageSlice2[] = [];
  const queue = [...rows];
  let firstPage = true;

  while (queue.length > 0) {
    const cap = firstPage ? FIRST_PAGE_ITEMS_CAP : NEXT_PAGE_ITEMS_CAP;
    const chunk: FlatRow[] = [];
    let used = 0;

    while (queue.length > 0) {
      const h = estimateFlatRowH(queue[0]);
      if (used + h > cap && chunk.length > 0) break;
      chunk.push(queue.shift()!);
      used += h;
    }

    pages.push({ rows: chunk, isFirst: firstPage, isLast: queue.length === 0 });
    firstPage = false;
  }

  // Check whether footer fits on last page
  const lp = pages[pages.length - 1];
  const lpCap = lp.isFirst ? FIRST_PAGE_ITEMS_CAP : NEXT_PAGE_ITEMS_CAP;
  const lpUsed = lp.rows.reduce((s, r) => s + estimateFlatRowH(r), 0);
  if (lpUsed + FOOTER_H > lpCap) {
    lp.isLast = false;
    pages.push({ rows: [], isFirst: false, isLast: true });
  }

  return pages;
}

export const Invoice2Preview = forwardRef<HTMLDivElement, Invoice2PreviewProps>(
  ({ data }, ref) => {
    const {
      invoiceNumber = "INV2-001",
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
        currency: "USD",
      },
      services = [],
      vat = 0,
      discount = 0,
    } = data;

    const currency = paymentInfo.currency || "USD";

    const grandSubtotal = useMemo(
      () =>
        services.reduce(
          (s, svc) =>
            s + svc.items.reduce((a, i) => a + i.quantity * i.unitPrice, 0),
          0,
        ),
      [services],
    );
    const vatAmount = ((grandSubtotal - (discount ?? 0)) * (vat ?? 0)) / 100;
    const grandTotal = grandSubtotal + vatAmount - (discount ?? 0);

    const flatRows = useMemo(
      () => flattenServices(services, currency),
      [services, currency],
    );
    const pages = useMemo(() => buildPages2(flatRows), [flatRows]);

    return (
      <div ref={ref}>
        {pages.map((page, pageIdx) => (
          <div
            key={pageIdx}
            data-invoice-page="true"
            style={{
              width: `${PAGE_WIDTH_2}px`,
              height: `${PAGE_HEIGHT_2}px`,
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

              {/* ── Items table ───────────────────────────────────── */}
              <div
                style={{
                  width: "100%",
                  borderTop: "1px solid #7D7E81",
                  paddingTop: "8px",
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
                      <th style={{ textAlign: "left", paddingBottom: "6px" }}>
                        Services &amp; Items
                      </th>
                      <th style={{ textAlign: "center", paddingBottom: "6px" }}>
                        Qty
                      </th>
                      <th style={{ textAlign: "center", paddingBottom: "6px" }}>
                        Unit Price
                      </th>
                      <th style={{ textAlign: "center", paddingBottom: "6px" }}>
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {page.rows.length > 0
                      ? page.rows.map((row, ri) => {
                          if (row.type === "service-header") {
                            return (
                              <tr key={ri}>
                                <td
                                  colSpan={4}
                                  style={{
                                    background: "#5A378F",
                                    color: "white",
                                    fontSize: "11px",
                                    fontWeight: "bold",
                                    padding: "6px 8px",
                                    borderRadius: "2px",
                                  }}
                                >
                                  {row.idx + 1}. {row.name}
                                </td>
                              </tr>
                            );
                          }

                          if (row.type === "subtotal") {
                            return (
                              <tr key={ri} style={{ background: "#f5f3ff" }}>
                                <td
                                  colSpan={3}
                                  style={{
                                    textAlign: "right",
                                    fontSize: "10px",
                                    fontWeight: "bold",
                                    padding: "5px 8px",
                                    color: "#5A378F",
                                  }}
                                >
                                  Service Subtotal:
                                </td>
                                <td
                                  style={{
                                    textAlign: "center",
                                    fontSize: "10px",
                                    fontWeight: "bold",
                                    padding: "5px 0",
                                    color: "#5A378F",
                                  }}
                                >
                                  {currency} {row.amount.toFixed(2)}
                                </td>
                              </tr>
                            );
                          }

                          // item row
                          return (
                            <tr
                              key={ri}
                              style={{ borderTop: "1px solid #e5e7eb" }}
                            >
                              <td
                                style={{
                                  textAlign: "left",
                                  fontSize: "12px",
                                  padding: "7px 0 7px 14px",
                                }}
                              >
                                <span style={{ fontWeight: 600 }}>
                                  {row.itemIdx + 1}. {row.item.name}
                                </span>
                                {row.item.note && (
                                  <p
                                    style={{
                                      fontSize: "10px",
                                      color: "#6b7280",
                                      margin: "2px 0 0",
                                      fontStyle: "italic",
                                    }}
                                  >
                                    {row.item.note}
                                  </p>
                                )}
                                {row.item.subItems &&
                                  row.item.subItems.length > 0 && (
                                    <ul
                                      style={{
                                        margin: "2px 0 0",
                                        padding: 0,
                                        listStyle: "none",
                                      }}
                                    >
                                      {row.item.subItems.map((sub, si) => (
                                        <li
                                          key={si}
                                          style={{
                                            fontSize: "10px",
                                            color: "#4b5563",
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
                                {row.item.quantity}
                              </td>
                              <td
                                style={{
                                  textAlign: "center",
                                  padding: "7px 0",
                                  fontSize: "12px",
                                  verticalAlign: "top",
                                }}
                              >
                                {currency} {row.item.unitPrice}
                              </td>
                              <td
                                style={{
                                  textAlign: "center",
                                  padding: "7px 0",
                                  fontSize: "12px",
                                  verticalAlign: "top",
                                }}
                              >
                                {currency}{" "}
                                {(
                                  row.item.quantity * row.item.unitPrice
                                ).toFixed(2)}
                              </td>
                            </tr>
                          );
                        })
                      : page.isLast &&
                        services.length === 0 && (
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
                              No services added
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
                          {grandSubtotal.toFixed(2)} ({paymentInfo.currency})
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

            {/* ── Bottom footer (every page) ─────────────────────── */}
            <div
              style={{
                borderTop: "1px solid #e5e7eb",
                paddingTop: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                flexShrink: 0,
              }}
            >
              {/* <div
                style={{
                  fontSize: "12px",
                  borderLeft: "1px solid #EA2B7B",
                  paddingLeft: "8px",
                }}
              >
                <p style={{ margin: 0 }}>{from.name}</p>
                <p
                  style={{
                    color: "#4b5563",
                    whiteSpace: "pre-line",
                    margin: 0,
                  }}
                >
                  {from.address}
                </p>
              </div> */}
              <div
                style={{
                  fontSize: "12px",
                  color: "#4b5563",
                  // borderLeft: "1px solid #EA2B7B",
                  // paddingLeft: "8px",
                }}
              >
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

Invoice2Preview.displayName = "Invoice2Preview";
