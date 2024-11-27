import mongoose, { Schema, Document } from "mongoose";

export interface ContactDocument extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
}

const ContactSchema = new Schema<ContactDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      match: [
        /^\S+@\S+\.\S+$/,
        "Please use a valid email address",
      ],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
  },
  { timestamps: true }
);

export const Contact = mongoose.model<ContactDocument>("Contact", ContactSchema);
