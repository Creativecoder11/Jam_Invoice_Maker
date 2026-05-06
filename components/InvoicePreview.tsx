"use client";

import React, { forwardRef } from "react";
import { InvoiceFormData } from "@/types/invoice";
import { format } from "date-fns";

type InvoicePreviewProps = {
  data: Partial<InvoiceFormData>;
};

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(({ data }, ref) => {
  const {
    invoiceNumber = "INV-001",
    name = "Invoice",
    logoUrl,
    from = { name: "", email: "", phone: "", address: "" },
    to = { name: "", email: "", phone: "", address: "" },
    date = new Date(),
    dueDate = new Date(),
    paymentInfo = { accountName: "", accountNumber: "", bankName: "", branch: "", swift: "", currency: "USD" },
    items = [],
    vat = 0,
    discount = 0,
    total = 0,
  } = data;

  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  return (
    <div 
      ref={ref}
      className="bg-white text-black p-8 mx-auto shadow-md"
      style={{ width: "210mm", minHeight: "297mm", boxSizing: "border-box" }}
    >
      <div className="flex justify-between items-start border-b pb-6 mb-6">
        <div>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-16 object-contain mb-4" />
          ) : (
            <div className="h-16 w-32 bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
              Logo Here
            </div>
          )}
          <h2 className="text-xl font-bold">{from.name || "Company Name"}</h2>
          <p className="text-sm text-gray-600 whitespace-pre-line">{from.address}</p>
          <p className="text-sm text-gray-600">{from.email}</p>
          <p className="text-sm text-gray-600">{from.phone}</p>
        </div>
        <div className="text-right">
          <h1 className="text-4xl font-light text-gray-800 uppercase tracking-widest">{name}</h1>
          <p className="text-lg font-medium mt-2">#{invoiceNumber}</p>
        </div>
      </div>

      <div className="flex justify-between mb-8">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Billed To</h3>
          <h2 className="text-lg font-bold">{to.name || "Client Name"}</h2>
          <p className="text-sm text-gray-600 whitespace-pre-line">{to.address}</p>
          <p className="text-sm text-gray-600">{to.email}</p>
          <p className="text-sm text-gray-600">{to.phone}</p>
        </div>
        <div className="text-right">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Invoice Details</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-gray-600">Date Issued:</span>
            <span className="font-medium">{date ? format(new Date(date), "MMM dd, yyyy") : ""}</span>
            <span className="text-gray-600">Due Date:</span>
            <span className="font-medium">{dueDate ? format(new Date(dueDate), "MMM dd, yyyy") : ""}</span>
          </div>
        </div>
      </div>

      <table className="w-full mb-8">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="py-2 text-left text-sm font-semibold text-gray-600">Description</th>
            <th className="py-2 text-center text-sm font-semibold text-gray-600">Qty</th>
            <th className="py-2 text-right text-sm font-semibold text-gray-600">Unit Price</th>
            <th className="py-2 text-right text-sm font-semibold text-gray-600">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-b border-gray-100">
              <td className="py-3 text-sm">{item.name || "Item description"}</td>
              <td className="py-3 text-center text-sm">{item.quantity}</td>
              <td className="py-3 text-right text-sm">{paymentInfo.currency} {Number(item.unitPrice || 0).toFixed(2)}</td>
              <td className="py-3 text-right text-sm font-medium">{paymentInfo.currency} {(item.quantity * item.unitPrice).toFixed(2)}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr className="border-b border-gray-100">
              <td colSpan={4} className="py-4 text-center text-sm text-gray-400">No items added</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex justify-end mb-12">
        <div className="w-64">
          <div className="flex justify-between py-1 text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span>{paymentInfo.currency} {subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between py-1 text-sm">
              <span className="text-gray-600">Discount:</span>
              <span className="text-red-500">-{paymentInfo.currency} {discount.toFixed(2)}</span>
            </div>
          )}
          {vat > 0 && (
            <div className="flex justify-between py-1 text-sm">
              <span className="text-gray-600">VAT ({vat}%):</span>
              <span>{paymentInfo.currency} {((subtotal - discount) * (vat / 100)).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-gray-300 mt-2 pt-2">
            <span className="font-bold">Total Due:</span>
            <span className="font-bold text-lg">{paymentInfo.currency} {total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="border-t pt-6 text-sm text-gray-600">
        <h3 className="font-semibold text-gray-800 mb-2">Payment Information</h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          {paymentInfo.bankName && <p><strong>Bank:</strong> {paymentInfo.bankName}</p>}
          {paymentInfo.accountName && <p><strong>Account Name:</strong> {paymentInfo.accountName}</p>}
          {paymentInfo.accountNumber && <p><strong>Account No:</strong> {paymentInfo.accountNumber}</p>}
          {paymentInfo.branch && <p><strong>Branch:</strong> {paymentInfo.branch}</p>}
          {paymentInfo.swift && <p><strong>SWIFT/BIC:</strong> {paymentInfo.swift}</p>}
        </div>
      </div>
    </div>
  );
});
InvoicePreview.displayName = "InvoicePreview";
