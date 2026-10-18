import React, { forwardRef } from "react";
import { InvoiceFormData, InvoiceItem } from "@/types/invoice";
import { format } from "date-fns";

type InvoicePreviewProps = {
  data: Partial<InvoiceFormData>;
};

export const PAGE_WIDTH = 612;
export const PAGE_HEIGHT = 842;

const PADDING = 30;

// A4 preview layout measurements used for deterministic PDF pagination.
const BOTTOM_FOOTER_H = 72;
const HEADER_H = 165;
const TITLE_H = 60;
const TABLE_HEADER_H = 32;
const FIRST_PAGE_GAP = 32;
const FOOTER_H = 10;

const USABLE_H = PAGE_HEIGHT - PADDING * 2 - BOTTOM_FOOTER_H;

const FIRST_PAGE_ITEMS_CAP =
  USABLE_H - HEADER_H - TITLE_H - TABLE_HEADER_H - FIRST_PAGE_GAP;

const NEXT_PAGE_ITEMS_CAP = USABLE_H - HEADER_H - TITLE_H - TABLE_HEADER_H;

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

  const lp = pages[pages.length - 1];
  const lpCap = lp.isFirst ? FIRST_PAGE_ITEMS_CAP : NEXT_PAGE_ITEMS_CAP;
  const lpUsed = lp.items.reduce((s, item) => s + estimateItemH(item), 0);

  // Move the totals and payment block to a trailing page when it cannot fit.
  if (lpUsed + FOOTER_H > lpCap) {
    lp.isLast = false;
    pages.push({ items: [], isFirst: false, isLast: true });
  }

  return pages;
}

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  ({ data }, ref) => {
    const {
      invoiceNumber = "INV-001",
      name = "Invoice",
      logoUrl,
      type,
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
        routingNumber: "",
        currency: "$",
      },
      notes,
      items = [],
      vat = 0,
      discount = 0,
      advancePaid = 0,
    } = data;

    const isQuotation = type === "quotation";

    const subtotal = items.reduce(
      (acc, item) => acc + item.quantity * item.unitPrice,
      0,
    );
    const vatAmount = ((subtotal - (discount ?? 0)) * (vat ?? 0)) / 100;
    const grandTotal = subtotal + vatAmount - (discount ?? 0) - (advancePaid ?? 0);
    const cur = paymentInfo.currency || "";
    const totalRows = [
      {
        label: "Sub-Total",
        value: `${subtotal.toFixed(2)} (${cur})`,
      },
      ...((vat ?? 0) > 0
        ? [{ label: `VAT (${vat}%)`, value: `${vatAmount.toFixed(2)} (${cur})` }]
        : []),
      ...((discount ?? 0) > 0
        ? [{ label: "Discount (-)", value: `${Number(discount).toFixed(2)} (${cur})` }]
        : []),
      ...((advancePaid ?? 0) > 0
        ? [{ label: "Advance Paid (-)", value: `${Number(advancePaid).toFixed(2)} (${cur})` }]
        : []),
      {
        label: "Grand Total",
        value: `${Number(grandTotal).toFixed(2)} (${cur})`,
      },
    ];

    const pages = buildPages(items);

    // Keeps item numbering continuous across paginated invoice pages.
    const startIndices = (() => {
      let offset = 0;
      return pages.map((p) => {
        const s = offset;
        offset += p.items.length;
        return s;
      });
    })();

    return (
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
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        crossOrigin="anonymous"
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "contain",
                        }}
                        alt="Logo"
                      />
                    ) : (
                      <div
                        style={{
                          width: "80px",
                          height: "80px",
                          background: "#f3f4f6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                          color: "#9ca3af",
                        }}
                      >
                        Logo
                      </div>
                    )}
                    {from.name && (
                      <div style={{ fontSize: "11px" }}>
                        <h4 style={{ color: "#5A378F", fontWeight: "bold", margin: 0 }}>From:</h4>
                        <p style={{ fontWeight: 700, margin: 0 }}>{from.name}</p>
                        {from.address && <p style={{ color: "#4b5563", margin: 0 }}>{from.address}</p>}
                        {from.phone   && <p style={{ color: "#4b5563", margin: 0 }}>{from.phone}</p>}
                        {from.email   && <p style={{ color: "#4b5563", margin: 0 }}>{from.email}</p>}
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

              {/* Items table */}
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
                          width: "70px",
                          whiteSpace: "nowrap",
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
                          width: "60px",
                          whiteSpace: "nowrap",
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
                          width: "60px",
                          whiteSpace: "nowrap",
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
                                  wordBreak: "break-word",
                                  minWidth: 0,
                                }}
                              >
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
                                  padding: "7px 4px",
                                  fontSize: "12px",
                                  verticalAlign: "top",
                                  whiteSpace: "nowrap",
                                  width: "70px",
                                }}
                              >
                                {item.unitPrice}
                              </td>
                              <td
                                style={{
                                  textAlign: "center",
                                  padding: "7px 4px",
                                  fontSize: "12px",
                                  verticalAlign: "top",
                                  whiteSpace: "nowrap",
                                  width: "90px",
                                }}
                              >
                                {item.quantity}
                              </td>
                              <td
                                style={{
                                  textAlign: "center",
                                  padding: "7px 4px",
                                  fontSize: "12px",
                                  verticalAlign: "top",
                                  lineHeight: 1,
                                  whiteSpace: "nowrap",
                                  width: "90px",
                                }}
                              >
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
                      {totalRows.map((row) => (
                        <div
                          key={row.label}
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
                            {row.label}
                          </h2>
                          <h2
                            style={{
                              margin: 0,
                              fontSize: "12px",
                              fontWeight: "bold",
                              lineHeight: 1.2,
                            }}
                          >
                            {row.value}
                          </h2>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ width: "100%" }}>
                    {isQuotation ? (
                      /* Notes block for quotations */
                      (notes?.text || (notes?.points && notes.points.length > 0)) ? (
                        <div
                          style={{
                            width: "100%",
                            padding: "10px 16px",
                            border: "1px solid #5A378F",
                            backgroundColor: "#5A3691",
                            marginTop: "8px",
                          }}
                        >
                          <h3
                            style={{
                              fontSize: "12px",
                              fontWeight: "bold",
                              color: "white",
                              margin: 0,
                              marginBottom: "6px",
                            }}
                          >
                            Notes:
                          </h3>
                          {notes?.text && (
                            <p
                              style={{
                                fontSize: "10px",
                                color: "white",
                                margin: 0,
                                marginBottom: notes?.points?.length ? "6px" : 0,
                                whiteSpace: "pre-line",
                              }}
                            >
                              {notes.text}
                            </p>
                          )}
                          {notes?.points && notes.points.length > 0 && (
                            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                              {notes.points.map((pt, i) => (
                                <li
                                  key={i}
                                  style={{ fontSize: "10px", color: "white", margin: 0, marginBottom: "2px" }}
                                >
                                  • {pt}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : null
                    ) : (
                      /* Payment info block for invoices */
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
                        <div
                          style={{
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
                            <div style={{ display: "flex", flexDirection: "row", gap: "4px" }}>
                              <p style={{ fontSize: "8px", color: "white", margin: 0 }}>Account Name:</p>
                              <h4 style={{ fontSize: "8px", fontWeight: "bold", margin: 0 }}>{paymentInfo.accountName}</h4>
                            </div>
                            <div style={{ display: "flex", flexDirection: "row", gap: "4px" }}>
                              <p style={{ fontSize: "8px", color: "white", margin: 0 }}>Account Number:</p>
                              <h4 style={{ fontSize: "8px", fontWeight: "bold", margin: 0 }}>{paymentInfo.accountNumber}</h4>
                            </div>
                            <div style={{ display: "flex", flexDirection: "row", gap: "4px" }}>
                              <p style={{ fontSize: "8px", color: "white", margin: 0 }}>Bank Name:</p>
                              <h4 style={{ fontSize: "8px", fontWeight: "bold", margin: 0 }}>{paymentInfo.bankName}</h4>
                            </div>
                            <div style={{ display: "flex", flexDirection: "row", gap: "4px" }}>
                              <p style={{ fontSize: "8px", color: "white", margin: 0 }}>Branch:</p>
                              <h4 style={{ fontSize: "8px", fontWeight: "bold", margin: 0 }}>{paymentInfo.branch}</h4>
                            </div>
                            <div style={{ display: "flex", flexDirection: "row", gap: "4px" }}>
                              <p style={{ fontSize: "8px", color: "white", margin: 0 }}>SWIFT Code:</p>
                              <h4 style={{ fontSize: "8px", fontWeight: "bold", margin: 0 }}>{paymentInfo.swift}</h4>
                            </div>
                            <div style={{ display: "flex", flexDirection: "row", gap: "4px" }}>
                              <p style={{ fontSize: "8px", color: "white", margin: 0 }}>Routing Number:</p>
                              <h4 style={{ fontSize: "8px", fontWeight: "bold", margin: 0 }}>{paymentInfo.routingNumber}</h4>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        ))}
      </div>
    );
  },
);

InvoicePreview.displayName = "InvoicePreview";
