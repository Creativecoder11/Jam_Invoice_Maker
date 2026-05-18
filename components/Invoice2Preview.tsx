import React, { forwardRef } from "react";
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
const FOOTER_H = 200;

// A4 preview layout measurements used for deterministic PDF pagination.
const USABLE_H = PAGE_HEIGHT_2 - PADDING * 2 - BOTTOM_FOOTER_H;
const FIRST_PAGE_ITEMS_CAP =
  USABLE_H - HEADER_H - TITLE_H - TABLE_HEADER_H - FIRST_PAGE_GAP;
const NEXT_PAGE_ITEMS_CAP = USABLE_H - TABLE_HEADER_H;

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

  const lp = pages[pages.length - 1];
  const lpCap = lp.isFirst ? FIRST_PAGE_ITEMS_CAP : NEXT_PAGE_ITEMS_CAP;
  const lpUsed = lp.rows.reduce((s, r) => s + estimateFlatRowH(r), 0);

  // Move the totals and payment block to a trailing page when it cannot fit.
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

    const grandSubtotal = services.reduce(
      (s, svc) =>
        s + svc.items.reduce((a, i) => a + i.quantity * i.unitPrice, 0),
      0,
    );
    const vatAmount = ((grandSubtotal - (discount ?? 0)) * (vat ?? 0)) / 100;
    const grandTotal = grandSubtotal + vatAmount - (discount ?? 0);

    const flatRows = flattenServices(services, currency);
    const pages = buildPages2(flatRows);

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
              fontFamily:
                "'HelveticaNowDisplay', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
            }}
          >
            {/* Main invoice content */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              {/* Header */}
              {page.isFirst && (
                <header
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "14px",
                  }}
                >
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
                  <div style={{ textAlign: "left", fontSize: "12px" }}>
                    <div>
                      <h4
                        style={{
                          color: "#5A378F",
                          fontWeight: "bold",
                          margin: 0,
                        }}
                      >
                        To:
                      </h4>
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

              {/* Invoice title */}
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

              {/* Invoice dates */}
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

              {/* Services and items table */}
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

              {/* Totals and payment information */}
              {page.isLast && (
                <div style={{ marginTop: "8px" }}>
                  <div style={{ width: "100%" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        fontSize: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "12px",
                          fontWeight: "bold",
                          height: "32px",
                          lineHeight: 1.2,
                          borderTop: "1px solid #B1B1B1",
                        }}
                      >
                        <h2
                          style={{
                            color: "#EA2B7B",
                            margin: 0,
                            fontSize: "12px",
                            fontWeight: "bold",
                            lineHeight: 1.2,
                          }}
                        >
                          Sub-Total
                        </h2>
                        <h2
                          style={{
                            margin: 0,
                            fontSize: "12px",
                            fontWeight: "bold",
                            lineHeight: 1.2,
                          }}
                        >
                          {grandSubtotal.toFixed(2)} ({paymentInfo.currency})
                        </h2>
                      </div>

                      {(vat ?? 0) > 0 && (
                        <>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: "12px",
                              fontWeight: "bold",
                              height: "32px",
                              lineHeight: 1.2,
                              borderTop: "1px solid #B1B1B1",
                            }}
                          >
                            <h2
                              style={{
                                color: "#EA2B7B",
                                margin: 0,
                                fontSize: "12px",
                                fontWeight: "bold",
                                lineHeight: 1.2,
                              }}
                            >
                              VAT ({vat}%)
                            </h2>
                            <h2
                              style={{
                                margin: 0,
                                fontSize: "12px",
                                fontWeight: "bold",
                                lineHeight: 1.2,
                              }}
                            >
                              {vatAmount.toFixed(2)} ({paymentInfo.currency})
                            </h2>
                          </div>
                        </>
                      )}

                      {(discount ?? 0) > 0 && (
                        <>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: "12px",
                              fontWeight: "bold",
                              height: "32px",
                              lineHeight: 1.2,
                              borderTop: "1px solid #B1B1B1",
                            }}
                          >
                            <h2
                              style={{
                                color: "#EA2B7B",
                                margin: 0,
                                fontSize: "12px",
                                fontWeight: "bold",
                                lineHeight: 1.2,
                              }}
                            >
                              Discount (-)
                            </h2>
                            <h2
                              style={{
                                margin: 0,
                                fontSize: "12px",
                                fontWeight: "bold",
                                lineHeight: 1.2,
                              }}
                            >
                              {Number(discount).toFixed(2)} (
                              {paymentInfo.currency})
                            </h2>
                          </div>
                        </>
                      )}

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "12px",
                          fontWeight: "bold",
                          height: "32px",
                          lineHeight: 1.2,
                          borderTop: "1px solid #B1B1B1",
                        }}
                      >
                        <h2
                          style={{
                            color: "#EA2B7B",
                            margin: 0,
                            fontSize: "12px",
                            fontWeight: "bold",
                            lineHeight: 1.2,
                          }}
                        >
                          Grand Total
                        </h2>
                        <h2
                          style={{
                            margin: 0,
                            fontSize: "12px",
                            fontWeight: "bold",
                            lineHeight: 1.2,
                          }}
                        >
                          {Number(grandTotal).toFixed(2)} (
                          {paymentInfo.currency})
                        </h2>
                      </div>
                    </div>
                  </div>

                  <div style={{ width: "100%" }}>
                    <div
                      style={{
                        width: "100%",
                        color: "white",
                        padding: "10px 32px 10px 32px",
                        border: "1px solid #5A378F",
                        backgroundColor: "#5A3691",
                        gap: "8px",
                        marginTop: "8px",
                        verticalAlign: "top",
                      }}
                    >
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                        }}
                      >
                        <tbody>
                          <tr>
                            <td style={{ verticalAlign: "middle", padding: 0 }}>
                              <h3
                                style={{
                                  fontSize: "16px",
                                  fontWeight: "bold",
                                  margin: 0,
                                  lineHeight: 1.2,
                                  color: "white",
                                }}
                              >
                                Payment Information:
                              </h3>
                            </td>
                            <td
                              style={{
                                verticalAlign: "middle",
                                textAlign: "left",
                                fontSize: "10px",
                                padding: 0,
                              }}
                            >
                              <div style={{ lineHeight: 1.4 }}>
                                <span
                                  style={{
                                    fontSize: "8px",
                                    color: "white",
                                  }}
                                >
                                  Account Number:{" "}
                                </span>
                                <span
                                  style={{
                                    fontSize: "8px",
                                    fontWeight: "bold",
                                    color: "white",
                                  }}
                                >
                                  {paymentInfo.accountNumber}
                                </span>
                              </div>
                              <div style={{ lineHeight: 1.4 }}>
                                <span
                                  style={{
                                    fontSize: "8px",
                                    color: "white",
                                  }}
                                >
                                  SWIFT Code:{" "}
                                </span>
                                <span
                                  style={{
                                    fontSize: "8px",
                                    fontWeight: "bold",
                                    color: "white",
                                  }}
                                >
                                  {paymentInfo.swift}
                                </span>
                              </div>
                              <div style={{ lineHeight: 1.4 }}>
                                <span
                                  style={{
                                    fontSize: "8px",
                                    color: "white",
                                  }}
                                >
                                  Bank Name:{" "}
                                </span>
                                <span
                                  style={{
                                    fontSize: "8px",
                                    fontWeight: "bold",
                                    color: "white",
                                  }}
                                >
                                  {paymentInfo.bankName}
                                </span>
                              </div>
                              <div style={{ lineHeight: 1.4 }}>
                                <span
                                  style={{
                                    fontSize: "8px",
                                    color: "white",
                                  }}
                                >
                                  Branch:{" "}
                                </span>
                                <span
                                  style={{
                                    fontSize: "8px",
                                    fontWeight: "bold",
                                    color: "white",
                                  }}
                                >
                                  {paymentInfo.branch}
                                </span>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom footer */}
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
              <div
                style={{
                  fontSize: "12px",
                  color: "#4b5563",
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
                  style={{ objectFit: "contain" }}
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
