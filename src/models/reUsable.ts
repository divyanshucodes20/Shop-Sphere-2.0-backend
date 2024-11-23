import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId:{
       type:String,
       required:[true, "Please enter User"],
       ref: "User",
    },
    userName:{
      type:String,
      required:[true, "Please enter User Name"],
      ref: "User"
    },
    name: {
      type: String,
      required: [true, "Please enter Name"],
    },
    photos: [
      {
        public_id: {
          type: String,
          required: [true, "Please enter Public ID"],
        },
        url: {
          type: String,
          required: [true, "Please enter URL"],
        },
      },
    ],
    price: {
      type: Number,
      required: [true, "Please enter Price"],
    },
    stock: {
      type: Number,
      required: [true, "Please enter Stock"],
    },
    category: {
      type: String,
      required: [true, "Please enter Category"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Please enter Description"],
    },
  },
  {
    timestamps: true,
  }
);

export const ReUsableProduct = mongoose.model("ReUsableProduct", schema);
