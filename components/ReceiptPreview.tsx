"use client";

import React, { forwardRef } from "react";
import { InvoiceFormData, ReceiptInfo } from "@/types/invoice";
import { format } from "date-fns";
import { numberToWords } from "@/lib/numberToWords";

type Props = { data: Partial<InvoiceFormData> };

export const PAGE_WIDTH_R = 612;
export const PAGE_HEIGHT_R = 842;
const P = 30; // padding

const PURPLE = "#5A378F";
const YELLOW = "#F5A800";

const defaultReceiptInfo = (): ReceiptInfo => ({
  currency: "BDT",
  showInvoiceNo: true,
  lineItems: [],
  paidAmount: 0,
  receivedAmount: 0,
  paymentMethod: "",
  accountTransferName: "",
  receivedBy: {
    name: "",
    designation: "",
    companyName: "",
    address: "",
    mobile: "",
  },
});

export const ReceiptPreview = forwardRef<HTMLDivElement, Props>(
  ({ data }, ref) => {
    const {
      invoiceNumber = "",
      logoUrl,
      from = { name: "", email: "", phone: "", address: "" },
      to = { name: "", email: "", phone: "", address: "" },
      date = new Date(),
      receiptInfo: ri = defaultReceiptInfo(),
    } = data;

    const currency       = ri.currency || "BDT";
    const totalDue       = (ri.lineItems || []).reduce((s, i) => s + (i.amount || 0), 0);
    const paidAmount     = ri.paidAmount     || 0;
    const receivedAmount = ri.receivedAmount || 0;
    const currentDue     = totalDue - paidAmount - receivedAmount;
    const wordsText      = numberToWords(Math.abs(currentDue), currency);
    const showInvCol = ri.showInvoiceNo !== false;

    return (
      <div ref={ref}>
        <div
          data-invoice-page="true"
          style={{
            width: `${PAGE_WIDTH_R}px`,
            minHeight: `${PAGE_HEIGHT_R}px`,
            padding: `${P}px`,
            background: "white",
            color: "#1a1a1a",
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
            fontFamily: "Arial, sans-serif",
            fontSize: "11px",
          }}
        >
          {/* ── HEADER: Logo + Company Info ────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "10px",
            }}
          >
            <div>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  crossOrigin="anonymous"
                  style={{
                    width: "72px",
                    height: "72px",
                    objectFit: "contain",
                  }}
                  alt="Logo"
                />
              ) : (
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    background: "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
                    color: "#9ca3af",
                    borderRadius: "4px",
                  }}
                >
                  Logo
                </div>
              )}
            </div>
            <div style={{ textAlign: "right", fontSize: "10px" }}>
              <div
                style={{ fontWeight: "bold", fontSize: "12px", color: PURPLE }}
              >
                {from.name || "Company Name"}
              </div>
              {from.address && (
                <div style={{ color: "#374151", whiteSpace: "pre-line" }}>
                  {from.address}
                </div>
              )}
              {from.phone && (
                <div style={{ color: "#374151" }}>{from.phone}</div>
              )}
              {from.email && (
                <div style={{ color: "#374151" }}>{from.email}</div>
              )}
            </div>
          </div>

          {/* ── TITLE ──────────────────────────────────────────────────────── */}
          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            <span
              style={{
                fontSize: "20px",
                fontWeight: "900",
                letterSpacing: "2px",
                color: "#1a1a1a",
              }}
            >
              PAYMENT RECEIPT
            </span>
          </div>

          {/* separator */}
          <hr
            style={{
              border: "none",
              borderTop: "1px solid #1a1a1a",
              margin: "0 0 8px 0",
            }}
          />

          {/* ── BILL TO + INVOICE NO / DATE ────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "8px",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "11px",
                  color: PURPLE,
                  marginBottom: "4px",
                }}
              >
                BILL TO:
              </div>
              <div style={{ fontWeight: "bold", fontSize: "12px" }}>
                {to.name}
              </div>
              {to.address && (
                <div style={{ fontSize: "10px", color: "#374151" }}>
                  {to.address}
                </div>
              )}
              {to.phone && (
                <div style={{ fontSize: "10px", color: "#374151" }}>
                  M: {to.phone}
                </div>
              )}
              {to.email && (
                <div style={{ fontSize: "10px", color: "#374151" }}>
                  {to.email}
                </div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  justifyContent: "flex-end",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    fontWeight: "bold",
                    fontSize: "11px",
                    color: PURPLE,
                  }}
                >
                  INVOICE NO :
                </span>
                <span style={{ fontWeight: "bold", fontSize: "11px" }}>
                  {invoiceNumber || "—"}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  justifyContent: "flex-end",
                }}
              >
                <span
                  style={{
                    fontWeight: "bold",
                    fontSize: "11px",
                    color: PURPLE,
                  }}
                >
                  DATE :
                </span>
                <span style={{ fontWeight: "bold", fontSize: "11px" }}>
                  {format(new Date(date), "dd/MM/yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* separator */}
          <hr
            style={{
              border: "none",
              borderTop: "1px solid #9ca3af",
              margin: "0 0 0 0",
            }}
          />

          {/* ── TABLE ──────────────────────────────────────────────────────── */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "0",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: PURPLE, color: "white" }}>
                {showInvCol && (
                  <th
                    style={{
                      padding: "7px 8px",
                      fontWeight: "bold",
                      fontSize: "10px",
                      textAlign: "left",
                      width: "140px",
                      border: `1px solid ${PURPLE}`,
                    }}
                  >
                    INVOICE NO
                  </th>
                )}
                <th
                  style={{
                    padding: "7px 8px",
                    fontWeight: "bold",
                    fontSize: "10px",
                    textAlign: "left",
                    border: `1px solid ${PURPLE}`,
                  }}
                >
                  DESCRIPTION
                </th>
                <th
                  style={{
                    padding: "7px 8px",
                    fontWeight: "bold",
                    fontSize: "10px",
                    textAlign: "right",
                    width: "110px",
                    border: `1px solid ${PURPLE}`,
                  }}
                >
                  DUE AMOUNT
                </th>
              </tr>
            </thead>
            <tbody>
              {(ri.lineItems || []).length > 0 ? (
                (ri.lineItems || []).map((item, idx) => (
                  <tr
                    key={idx}
                    style={{ background: idx % 2 === 0 ? "white" : "#fafafa" }}
                  >
                    {showInvCol && (
                      <td
                        style={{
                          padding: "6px 8px",
                          fontSize: "11px",
                          border: "1px solid #e5e7eb",
                          verticalAlign: "top",
                        }}
                      >
                        {item.invoiceNo || "—"}
                      </td>
                    )}
                    <td
                      style={{
                        padding: "6px 8px",
                        fontSize: "11px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      {item.description}
                    </td>
                    <td
                      style={{
                        padding: "6px 8px",
                        fontSize: "11px",
                        textAlign: "right",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      {item.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={showInvCol ? 3 : 2}
                    style={{
                      padding: "16px 8px",
                      textAlign: "center",
                      color: "#9ca3af",
                      fontSize: "11px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    No items added
                  </td>
                </tr>
              )}

              {/* TOTAL DUE ROW */}
              <tr style={{ background: "#f9fafb" }}>
                <td
                  colSpan={showInvCol ? 2 : 1}
                  style={{
                    padding: "7px 8px",
                    fontWeight: "bold",
                    fontSize: "11px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  TOTAL DUE AMOUNT ({currency})
                </td>
                <td
                  style={{
                    padding: "7px 8px",
                    fontWeight: "bold",
                    fontSize: "11px",
                    textAlign: "right",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  {totalDue.toLocaleString()}
                </td>
              </tr>

              {/* ADVANCE AMOUNT ROW — only when > 0 */}
              {paidAmount > 0 && (
                <tr style={{ background: "#f9fafb" }}>
                  <td colSpan={showInvCol ? 2 : 1} style={{ padding: "7px 8px", fontWeight: "bold", fontSize: "11px", border: "1px solid #e5e7eb" }}>
                    ADVANCE AMOUNT ({currency})
                  </td>
                  <td style={{ padding: "7px 8px", fontWeight: "bold", fontSize: "11px", textAlign: "right", border: "1px solid #e5e7eb" }}>
                    {paidAmount.toLocaleString()}
                  </td>
                </tr>
              )}

              {/* PAID AMOUNT ROW — only when > 0 */}
              {receivedAmount > 0 && (
                <tr style={{ background: "#f9fafb" }}>
                  <td colSpan={showInvCol ? 2 : 1} style={{ padding: "7px 8px", fontWeight: "bold", fontSize: "11px", border: "1px solid #e5e7eb" }}>
                    PAID AMOUNT ({currency})
                  </td>
                  <td style={{ padding: "7px 8px", fontWeight: "bold", fontSize: "11px", textAlign: "right", border: "1px solid #e5e7eb" }}>
                    {receivedAmount.toLocaleString()}
                  </td>
                </tr>
              )}

              {/* CURRENT DUE ROW */}
              <tr style={{ background: "#f9fafb" }}>
                <td
                  colSpan={showInvCol ? 2 : 1}
                  style={{
                    padding: "7px 8px",
                    fontWeight: "bold",
                    fontSize: "11px",
                    border: "1px solid #e5e7eb",
                    color: PURPLE,
                  }}
                >
                  CURRENT DUE AMOUNT ({currency})
                </td>
                <td
                  style={{
                    padding: "7px 8px",
                    fontWeight: "bold",
                    fontSize: "11px",
                    textAlign: "right",
                    border: "1px solid #e5e7eb",
                    color: PURPLE,
                  }}
                >
                  {currentDue.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── DUE IN WORDS ───────────────────────────────────────────────── */}
          <div style={{ marginTop: "12px", fontSize: "11px" }}>
            <span style={{ fontWeight: "bold", color: PURPLE }}>
              Due Payment In Words:{" "}
            </span>
            <span style={{ fontWeight: "bold" }}>{wordsText}</span>
          </div>

          {/* ── PAYMENT RECEIVED IN ─────────────────────────────────────────── */}
          <div style={{ marginTop: "14px" }}>
            <div
              style={{
                fontWeight: "bold",
                fontSize: "11px",
                color: PURPLE,
                textDecoration: "underline",
                marginBottom: "8px",
              }}
            >
              PAYMENT RECEIVED IN :
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "14px",
                flexWrap: "wrap",
                fontSize: "11px",
              }}
            >
              {[
                { key: "cash" as const, label: "Cash" },
                { key: "cheque" as const, label: "Cheque" },
                { key: "accountTransfer" as const, label: "Acc. Transfer" },
              ].map(({ key, label }) => {
                const isChecked = ri.paymentMethod === key;

                return (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: "bold",
                        color: PURPLE,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {label}
                    </span>

                    {isChecked ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "15px",
                          height: "15px",
                          minWidth: "15px",
                          backgroundColor: PURPLE,
                          borderRadius: "2px",
                          color: "white",
                          fontSize: "10px",
                          fontWeight: "bold",
                          lineHeight: "1",
                        }}
                      >
                        ✓
                      </span>
                    ) : (
                      <span
                        style={{
                          color: "#9ca3af",
                          fontSize: "12px",
                          minWidth: "15px",
                          textAlign: "center",
                          fontWeight: "bold",
                        }}
                      >
                        —
                      </span>
                    )}

                    {isChecked &&
                      key === "accountTransfer" &&
                      ri.accountTransferName && (
                        <span
                          style={{
                            fontWeight: "bold",
                            color: "#1a1a1a",
                            fontSize: "11px",
                            marginLeft: "2px",
                          }}
                        >
                          ({ri.accountTransferName})
                        </span>
                      )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* separator */}
          <hr
            style={{
              border: "none",
              borderTop: "1px solid #9ca3af",
              margin: "12px 0",
            }}
          />

          {/* ── RECEIVED BY ────────────────────────────────────────────────── */}
          <div>
            <div
              style={{
                fontWeight: "bold",
                fontSize: "11px",
                color: PURPLE,
                textDecoration: "underline",
                marginBottom: "8px",
              }}
            >
              RECEIVED BY :
            </div>
            <div style={{ fontSize: "11px", lineHeight: "1.7" }}>
              {ri.receivedBy.name && (
                <div style={{ fontWeight: "bold" }}>{ri.receivedBy.name}</div>
              )}
              {ri.receivedBy.designation && (
                <div>{ri.receivedBy.designation}</div>
              )}
              {ri.receivedBy.companyName && (
                <div>{ri.receivedBy.companyName}</div>
              )}
              {ri.receivedBy.address && (
                <div style={{ whiteSpace: "pre-line" }}>
                  {ri.receivedBy.address}
                </div>
              )}
              {ri.receivedBy.mobile && <div>M: {ri.receivedBy.mobile}</div>}
              
            </div>
          </div>

          {/* ── BOTTOM FOOTER ──────────────────────────────────────────────── */}
          <div style={{ flexGrow: 1 }} />
          <div
            style={{
              borderTop: "1px solid #e5e7eb",
              paddingTop: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "16px",
            }}
          >
            <div style={{ fontSize: "10px", color: "#4b5563" }}>
              <div>+880 1784 398 934</div>
              <div>info@jamroll.xyz</div>
              <div>www.jamroll.xyz</div>
            </div>
            <img
              src="/assets/Jamroll Logo.png"
              alt="Jamroll"
              width={130}
              height={40}
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>
      </div>
    );
  },
);

ReceiptPreview.displayName = "ReceiptPreview";
