import mongoose, { Schema } from "mongoose";

const feedbackSchema = new Schema(
  {
    message: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Feedback = mongoose.models?.Feedback || mongoose.model("Feedback", feedbackSchema);
