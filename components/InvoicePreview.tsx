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
        currency: "$",
      },
      items = [],
      vat = 0,
      discount = 0,
      total = 0,
    } = data;

    const subtotal = items.reduce(
      (acc, item) => acc + item.quantity * item.unitPrice,
      0,
    );

    const vatAmount = ((subtotal - discount) * vat) / 100;
    const grandTotal = subtotal + vatAmount - discount;

    return (
      <div
        ref={ref}
        className="bg-white text-black mx-auto"
        style={{
          width: "612px",
          minHeight: "1000px",
          padding: "30px 30px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER */}
        <header className="flex flex-row items-start justify-between mb-6">
          <div className="w-1/2">
            {logoUrl ? (
              <img
                src={logoUrl}
                crossOrigin="anonymous"
                className="w-[73px] h-[110px] object-cover object-center rounded mb-2"
                alt="Logo"
              />
            ) : (
              <div className="w-[73px] h-[110px] bg-gray-100 flex items-center justify-center text-gray-400 text-xs rounded mb-2">
                Logo
              </div>
            )}
          </div>

          {/* FROM / TO on the right side */}
          <div className="w-1/2 text-right">
            <div className="mb-3">
              <h4 className="text-[#5A378F] text-xs font-bold">From:</h4>
              <div className="text-black text-xs mt-[2px]">
                <p className="font-bold">{from.name}</p>
                <p className="text-gray-600 whitespace-pre-line">
                  {from.address}
                </p>
                <p className="text-gray-600">{from.email}</p>
                <p className="text-gray-600">{from.phone}</p>
              </div>
            </div>
            <div>
              <h4 className="text-[#5A378F] text-xs font-bold">To:</h4>
              <div className="text-black text-xs mt-[2px]">
                <p className="font-bold">{to.name}</p>
                <p className="text-gray-600 whitespace-pre-line">
                  {to.address}
                </p>
                <p className="text-gray-600">{to.email}</p>
                <p className="text-gray-600">{to.phone}</p>
              </div>
            </div>
          </div>
        </header>

        {/* INVOICE TITLE */}
        <div className="flex justify-start gap-8 text-black text-[28px] font-bold uppercase mb-4">
          <h1>{name}</h1>
          <h1>#{invoiceNumber}</h1>
        </div>

        {/* DATES + ITEMS TABLE */}
        <main className="flex-grow">
          <div className="w-full flex my-4">
            {/* LEFT: Dates */}
            <div className="w-[25%] -mt-2">
              <h4 className="text-[12px] font-bold">Invoice Date:</h4>
              <p className="text-xs text-gray-700">
                {format(new Date(date), "MMM dd, yyyy")}
              </p>
              <h4 className="text-[12px] font-bold mt-6">Due Date:</h4>
              <p className="text-xs text-gray-700">
                {format(new Date(dueDate), "MMM dd, yyyy")}
              </p>
            </div>

            {/* RIGHT: Items Table */}
            <div className="w-[75%] border-t-1 border-[#7D7E81]">
              <div className="mt-2">
                <table className="w-full">
                  <thead>
                    <tr className="w-full text-[#5A378F] text-[12px] font-bold">
                      <th className="text-left">Items</th>
                      <th className="text-center">Quantity</th>
                      <th className="text-center leading-4">Unit Price</th>
                      <th className="text-center">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length > 0 ? (
                      items.map((item, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="text-left text-xs pt-2 pb-2">
                            <span className="font-semibold">{index + 1}. {item.name}</span>
                            {item.note && (
                              <p className="text-[10px] text-gray-500 mt-0.5 italic">{item.note}</p>
                            )}
                            {item.subItems && item.subItems.length > 0 && (
                              <ul className="mt-0.5">
                                {item.subItems.map((sub, si) => (
                                  <li key={si} className="text-[10px] text-gray-600">- {sub}</li>
                                ))}
                              </ul>
                            )}
                          </td>
                          <td className="text-center pt-2 pb-2 align-top text-xs">
                            {paymentInfo.currency}{item.unitPrice}
                          </td>
                          <td className="text-center pt-2 pb-2 align-top text-xs">
                            {item.quantity}
                          </td>
                          <td className="text-center pt-2 pb-2 align-top text-xs">
                            {paymentInfo.currency}{""}
                            {(item.quantity * item.unitPrice).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center py-6 text-gray-400 text-sm"
                        >
                          No items added
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="mt-auto">
          {/* PAYMENT INFO + TOTALS */}
          <div className="w-full flex my-4">
            {/* Payment Info Box */}
            <div className="w-[25%]">
              <div className="w-[114px] min-h-[120px] p-2 border border-[#5A378F]">
                <h3 className="text-[10px] font-bold underline mb-1">
                  Payment Information:
                </h3>
                <p className="text-[5px] text-[#7D7E81]">Account Name:</p>
                <h4 className="text-[8px] font-bold">
                  {paymentInfo.accountName}
                </h4>
                <p className="text-[5px] text-[#7D7E81]">Account Number:</p>
                <h4 className="text-[8px] font-bold">
                  {paymentInfo.accountNumber}
                </h4>
                <p className="text-[5px] text-[#7D7E81]">SWIFT Code:</p>
                <h4 className="text-[8px] font-bold">{paymentInfo.swift}</h4>
                <p className="text-[5px] text-[#7D7E81]">Bank Name:</p>
                <h4 className="text-[8px] font-bold">{paymentInfo.bankName}</h4>
                <p className="text-[5px] text-[#7D7E81]">Branch:</p>
                <h4 className="text-[8px] font-bold">{paymentInfo.branch}</h4>
              </div>
            </div>

            {/* Totals */}
            <div className="w-[75%]">
              <div className="text-sm w-full flex flex-col gap-[5.5px]">
                <div className="border-t-1 border-[#7D7E81]"></div>
                <div className="flex justify-between text-[10px] font-bold">
                  <h2 className="text-[#EA2B7B]">Sub-Total</h2>
                  <h2>
                    {subtotal.toFixed(2)} ({paymentInfo.currency})
                  </h2>
                </div>

                {vat > 0 && (
                  <>
                    <div className="border-t-1 border-[#7D7E81]"></div>
                    <div className="flex justify-between text-[10px] font-bold">
                      <h2 className="text-[#EA2B7B]">VAT ({vat}%)</h2>
                      <h2>
                        {vatAmount.toFixed(2)} ({paymentInfo.currency})
                      </h2>
                    </div>
                  </>
                )}

                {discount > 0 && (
                  <>
                    <div className="border-t-1 border-[#7D7E81]"></div>
                    <div className="flex justify-between text-[10px] font-bold">
                      <h2 className="text-[#EA2B7B]">Discount (-)</h2>
                      <h2>
                        {Number(discount).toFixed(2)} ({paymentInfo.currency})
                      </h2>
                    </div>
                  </>
                )}

                <div className="border-t-1 border-[#7D7E81]"></div>
                <div className="flex justify-between text-[10px] font-bold">
                  <h2 className="text-[#EA2B7B]">Grand Total</h2>
                  <h2>
                    {Number(grandTotal).toFixed(2)} ({paymentInfo.currency})
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </footer>

        {/* BOTTOM FOOTER */}
        <div className="w-full flex justify-between items-center gap-4 border-t border-gray-200 pt-4">
          <div className="text-black text-xs border-l-1 border-[#EA2B7B] ps-2">
            <p className="">{from.name}</p>
            <p className="text-gray-600 whitespace-pre-line">{from.address}</p>
          </div>
          {/* <div className="text-black text-xs border-l-2 border-[#EA2B7B] ps-2">
              <p>{from.phone}</p>
              <p>{from.email}</p>
            </div> */}
          <div className="text-gray-600 text-xs border-l-1 border-[#EA2B7B] ps-2">
            <p>+880 1784 398 934</p>
            <p>info@jamroll.xyz</p>
            <p>www.jamroll.xyz</p>
          </div>
          <div>
            <img
              src="/assets/Jamroll Logo.png"
              alt="Jamroll Logo"
              width={160}
              height={50}
              className="object-cover object-center"
            />
          </div>
        </div>
      </div>
    );
  },
);

InvoicePreview.displayName = "InvoicePreview";
