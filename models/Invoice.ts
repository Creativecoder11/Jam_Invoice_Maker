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

const invoiceSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true },
    name: { type: String, required: true }, // E.g., "Web Dev Services"
    type: { type: String, enum: ["invoice", "invoice2", "quotation"], default: "invoice" },
    logoUrl: { type: String },
    
    from: {
      name: { type: String, required: true },
      email: { type: String },
      phone: { type: String },
      address: { type: String },
    },
    
    to: {
      name: { type: String, required: true },
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
      currency: { type: String, default: "USD" },
    },
    
    items: { type: [itemSchema], default: [] },
    services: { type: [serviceGroupSchema], default: [] },
    
    vat: { type: Number, default: 0 }, // percentage
    discount: { type: Number, default: 0 }, // absolute amount
    total: { type: Number, required: true },
    
    status: { type: String, enum: ["Paid", "Unpaid", "Hold", "Cancelled"], default: "Unpaid" },
    
    creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Always delete the cached model so the latest schema is used.
// This is safe: delete removes the old registration, then we immediately recreate it.
// In production (serverless) each invocation is cold anyway.
// In development with HMR, this ensures schema changes take effect without a full restart.
delete (mongoose.models as any).Invoice;
export const Invoice = mongoose.model("Invoice", invoiceSchema);
