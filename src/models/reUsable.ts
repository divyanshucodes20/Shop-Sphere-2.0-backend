import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId:{
       type:String,
       required:[true, "Please enter User"],
       ref: "User",
    },
    userEmail:{
      type:String,
      required:[true, "Please enter User Email"],
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
    }
  },
  {
    timestamps: true,
  }
);
schema.virtual("totalPrice").get(function () {
  return this.productDetails?.price! + this.commission;
});



export const ReUsableProduct = mongoose.model("ReUsableProduct", schema);
