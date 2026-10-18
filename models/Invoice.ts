import mongoose, { Schema } from "mongoose";

const itemSchema = new Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  note: { type: String, default: "" },
  subItems: { type: [String], default: [] },
});

const serviceItemSchema = new Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  note: { type: String, default: "" },
  subItems: { type: [String], default: [] },
});

const serviceGroupSchema = new Schema({
  serviceName: { type: String, required: true },
  items: { type: [serviceItemSchema], default: [] },
});

const receiptLineItemSchema = new Schema({
  invoiceNo:   { type: String, default: "" },
  description: { type: String, default: "" },
  amount:      { type: Number, default: 0 },
});

const invoiceSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true },
    name: { type: String, required: true }, // E.g., "Web Dev Services"
    type: { type: String, enum: ["invoice", "serviceInvoice", "quotation", "receipt"], default: "invoice" },
    logoUrl: { type: String },
    
    from: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
      address: { type: String },
    },
    
    to: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
      address: { type: String },
    },
    
    date: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    
    paymentInfo: {
      accountName: { type: String },
      accountNumber: { type: String },
      bankName: { type: String },
      branch: { type: String },
      swift: { type: String },
      routingNumber: { type: String },
      currency: { type: String, default: "USD" },
    },
    
    items: { type: [itemSchema], default: [] },
    services: { type: [serviceGroupSchema], default: [] },
    
    vat: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    advancePaid: { type: Number, default: 0 },
    total: { type: Number, required: true },

    notes: {
      text:   { type: String, default: "" },
      points: { type: [String], default: [] },
    },

    receiptInfo: {
      currency:            { type: String, default: "BDT" },
      showInvoiceNo:       { type: Boolean, default: true },
      lineItems:           { type: [receiptLineItemSchema], default: [] },
      paidAmount:          { type: Number, default: 0 },
      receivedAmount:      { type: Number, default: 0 },
      paymentMethod:       { type: String, default: "" },
      accountTransferName: { type: String, default: "" },
      receivedBy: {
        name:        { type: String, default: "" },
        designation: { type: String, default: "" },
        companyName: { type: String, default: "" },
        address:     { type: String, default: "" },
        mobile:      { type: String, default: "" },
      },
    },
    
    status: { type: String, enum: ["Paid", "Unpaid", "Hold", "Cancelled"], default: "Unpaid" },

    creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    isDeleted:  { type: Boolean, default: false },
    deletedAt:  { type: Date },
  },
  { timestamps: true }
);

// Always delete the cached model so the latest schema is used.
// This is safe: delete removes the old registration, then we immediately recreate it.
// In production (serverless) each invocation is cold anyway.
// In development with HMR, this ensures schema changes take effect without a full restart.
delete (mongoose.models as any).Invoice;
export const Invoice = mongoose.model("Invoice", invoiceSchema);
