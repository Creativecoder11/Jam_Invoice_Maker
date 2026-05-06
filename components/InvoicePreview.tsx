"use client";

import React, { forwardRef } from "react";
import { InvoiceFormData } from "@/types/invoice";
import { format } from "date-fns";

type InvoicePreviewProps = {
  data: Partial<InvoiceFormData>;
};

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
        currency: "USD",
      },
      items = [],
      vat = 0,
      discount = 0,
      total = 0,
    } = data;

    const subtotal = items.reduce(
      (acc, item) => acc + item.quantity * item.unitPrice,
      0
    );

    const vatAmount = ((subtotal - discount) * vat) / 100;

    return (
      <div
        ref={ref}
        className="bg-white text-black mx-auto p-10 shadow"
        style={{ width: "210mm", minHeight: "297mm" }}
      >
        {/* HEADER */}
        <div className="flex justify-between items-start mb-6">
          <div>
            {logoUrl ? (
              <img src={logoUrl} className="h-16 mb-3" />
            ) : (
              <div className="h-16 w-32 bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                Logo
              </div>
            )}

            <p className="font-bold text-sm">{from.name}</p>
            <p className="text-xs text-gray-600 whitespace-pre-line">
              {from.address}
            </p>
            <p className="text-xs text-gray-600">{from.email}</p>
            <p className="text-xs text-gray-600">{from.phone}</p>
          </div>

          <div className="text-right">
            <h1 className="text-3xl font-bold uppercase">{name}</h1>
            <p className="text-lg mt-1">#{invoiceNumber}</p>
          </div>
        </div>

        {/* FROM / TO */}
        <div className="flex justify-between mb-6">
          <div>
            <h4 className="text-xs font-bold text-purple-600">From:</h4>
            <p className="text-sm font-semibold">{from.name}</p>
            <p className="text-xs text-gray-600">{from.address}</p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-purple-600">To:</h4>
            <p className="text-sm font-semibold">{to.name}</p>
            <p className="text-xs text-gray-600">{to.address}</p>
          </div>
        </div>

        {/* DATES + TABLE */}
        <div className="flex gap-6">
          {/* LEFT DATE */}
          <div className="w-[25%] text-xs">
            <p className="font-semibold">Invoice Date:</p>
            <p>{format(new Date(date), "MMM dd, yyyy")}</p>

            <p className="font-semibold mt-4">Due Date:</p>
            <p>{format(new Date(dueDate), "MMM dd, yyyy")}</p>
          </div>

          {/* RIGHT TABLE */}
          <div className="w-[75%]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-purple-600 text-xs">
                  <th className="text-left py-2">Item</th>
                  <th className="text-center">Qty</th>
                  <th className="text-center">Unit</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>

              <tbody>
                {items.length > 0 ? (
                  items.map((item, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2 text-left">
                        {i + 1}. {item.name}
                      </td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-center">
                        {paymentInfo.currency} {item.unitPrice}
                      </td>
                      <td className="text-right">
                        {paymentInfo.currency}{" "}
                        {(item.quantity * item.unitPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-400">
                      No items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER SECTION */}
        <div className="flex mt-10">
          {/* PAYMENT BOX */}
          <div className="w-[30%] border p-3 text-xs">
            <p className="font-bold underline mb-2">
              Payment Information
            </p>

            <p>Account: {paymentInfo.accountName}</p>
            <p>Number: {paymentInfo.accountNumber}</p>
            <p>Bank: {paymentInfo.bankName}</p>
            <p>Branch: {paymentInfo.branch}</p>
            <p>SWIFT: {paymentInfo.swift}</p>
          </div>

          {/* TOTALS */}
          <div className="w-[70%] pl-6">
            <div className="text-sm space-y-2">
              <div className="flex justify-between border-t pt-2">
                <span>Subtotal</span>
                <span>
                  {paymentInfo.currency} {subtotal.toFixed(2)}
                </span>
              </div>

              {vat > 0 && (
                <div className="flex justify-between border-t pt-2">
                  <span>VAT ({vat}%)</span>
                  <span>
                    {paymentInfo.currency} {vatAmount.toFixed(2)}
                  </span>
                </div>
              )}

              {discount > 0 && (
                <div className="flex justify-between border-t pt-2">
                  <span>Discount</span>
                  <span>- {paymentInfo.currency} {discount}</span>
                </div>
              )}

              <div className="flex justify-between border-t pt-2 font-bold text-lg">
                <span>Total</span>
                <span>
                  {paymentInfo.currency} {total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM FOOTER */}
        <div className="flex justify-between mt-10 text-xs border-t pt-4">
          <div>
            <p className="font-bold">{from.name}</p>
            <p>{from.address}</p>
          </div>

          <div>
            <p>{from.phone}</p>
            <p>{from.email}</p>
          </div>
        </div>
      </div>
    );
  }
);

InvoicePreview.displayName = "InvoicePreview";