import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      ref: "User",
    },
    reusableProductId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Reusable product ID is required"],
      ref: "ReUsableProduct",
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);




export const UserPayment = mongoose.model("UserPayment", schema);
