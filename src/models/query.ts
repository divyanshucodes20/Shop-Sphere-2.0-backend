import mongoose, { Schema } from "mongoose";

const querySchema = new Schema(
  {
   
   userId:{
    type:String,
    required:[true,"User must be provided"],
   },
    productDetails: {
      name: {
        type: String,
        required: true,
      },
      category: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      stock: {
        type: Number,
        required: true,
        min:[1,"Stock must be greater than 0"],
      },
      photos: [
        {
          public_id: {
            type: String,
            required: true,
          },
          url: {
            type: String,
            required: true,
          },
        },
      ],
    },
    queryStatus: {
      type: String,
      enum: ["pending", "approved","success"],
      default: "pending",
    },
    pickupDetails: {
      pickupAddress: {
        type: String,
        required: true,
      },
      pickupCity: {
        type: String,
        required: true,
      },
      pickupPostalCode: {
        type: String,
        required: true,
      },
    },
  },
  { timestamps: true }
);

export const ProductQuery = mongoose.model("ProductQuery", querySchema);
