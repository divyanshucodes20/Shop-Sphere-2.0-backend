import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  email: string;
  productId: string;
  productName: string;
}

const NotificationSchema = new Schema({
    email:{
        type:String,
        required:[true,"User Email is required"],
    },
    productId:{
        type:Schema.Types.ObjectId,
        ref:"Product",
        required:[true,"Product is required"],
    },
    productName:{
        type:String,
        required:[true,"Product Name is required"],
    }
},{timestamps:true});


export const Notification=mongoose.model<INotification>("Notification",NotificationSchema);

export default Notification;