import mongoose, { Schema } from "mongoose";

const clientSchema = new Schema(
  {
    name: { type: String, required: true },
    companyName: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

delete (mongoose.models as any).Client;
export const Client = mongoose.model("Client", clientSchema);
