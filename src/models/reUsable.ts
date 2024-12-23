import mongoose, {Document } from "mongoose";

interface ProductDetails {
  name: string;
  price: number;
  category: string;
  description: string;
  stock: number;
  photos: { public_id: string; url: string }[];
}

export interface ReUsableProductDocument extends Document {
  userId: string;
  productDetails?: ProductDetails;
  commission: number;
  totalPrice?: number;
}

const schema = new mongoose.Schema<ReUsableProductDocument>(
  {
    userId: {
      type: String,
      required: [true, "Please enter User"],
      ref: "User",
    },
    productDetails: {
      name: {
        type: String,
        required: [true, "Product name is required"],
      },
      category: {
        type: String,
        required: [true, "Product category is required"],
        trim: true,
      },
      description: {
        type: String,
        required: [true, "Product description is required"],
      },
      price: {
        type: Number,
        required: [true, "Product price is required"],
      },
      stock: {
        type: Number,
        required: [true, "Product stock is required"],
      },
      photos: [
        {
          public_id: {
            type: String,
            required: [true, "Photo public ID is required"],
          },
          url: {
            type: String,
            required: [true, "Photo URL is required"],
          },
        },
      ],
    },
    commission: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

schema.virtual("totalPrice").get(function (this: ReUsableProductDocument) {
  return (this.productDetails?.price ?? 0) + this.commission;
});

export const ReUsableProduct = mongoose.model<ReUsableProductDocument>(
  "ReUsableProduct",
  schema
);
