import { TryCatch } from "../middlewares/error.js";
import { UserPayment } from "../models/userPayment.js";
import ErrorHandler from "../utils/utility-class.js";



export const getUserPendingPayments=TryCatch(
    async(req,res,next)=>{
        const {userId}=req.query;
        if(!userId){
            return next(new ErrorHandler("Login to view your pending payments",400));
        }
        const payments=await UserPayment.find({userId,paymentStatus:"pending"});
        if (payments.length === 0) {
            return next(new ErrorHandler("No pending payments found", 404));
        }        
        res.status(200).json({
            success:true,
            payments
        })
    }
)


export const getUserCompletedPayments=TryCatch(
    async(req,res,next)=>{
        const {userId}=req.query;
        if(!userId){
            return next(new ErrorHandler("Login to view your completed payments",400));
        }
        const payments=await UserPayment.find({userId,paymentStatus:"completed"});
        if (payments.length === 0) {
            return next(new ErrorHandler("No pending payments found", 404));
        }
        
        res.status(200).json({
            success:true,
            payments
        })
    })      


export const getUserPayments=TryCatch(
    async(req,res,next)=>{
        const {userId}=req.query;
        if(!userId){
            return next(new ErrorHandler("Login to view your payments",400));
        }
        const payments=await UserPayment.find({userId});
        if (payments.length === 0) {
            return next(new ErrorHandler("No pending payments found", 404));
        }
        
        res.status(200).json({
            success:true,
            payments
        })
    }
)


export const getAllPendingPayments=TryCatch(
    async(req,res,next)=>{
        const payments=await UserPayment.find({paymentStatus:"pending"});
        if (payments.length === 0) {
    return next(new ErrorHandler("No pending payments found", 404));
}
        res.status(200).json({
            success:true,
            payments
        })
    }
)

export const getAdminAllPayments=TryCatch(

  async(req,res,next)=>{
        const payments=await UserPayment.find();
        if(!payments){
            return next(new ErrorHandler("No payments found",404));
        }
        if (payments.length === 0) {
        return next(new ErrorHandler("No Payments found", 404));
        }
        res.status(200).json({
            success:true,
            payments
        })
  }  
)

export const getAdminCompletedPayments=TryCatch(
    async(req,res,next)=>{
        const payments=await UserPayment.find({paymentStatus:"completed"});
        if(!payments){
            return next(new ErrorHandler("No completed payments found",404));
        }
        if (payments.length === 0) {
            return next(new ErrorHandler("No pending payments found", 404));
        }
        res.status(200).json({
            success:true,
            payments
        })
    }
)


export const getPaymentById=TryCatch(
    async(req,res,next)=>{
        const {paymentid}=req.params;
        const payment=await UserPayment.findById(paymentid);
        if(!payment){
            return next(new ErrorHandler("No payment found with this ID",404));
        }
        res.status(200).json({
            success:true,
            payment
        })
    }
)

export const  processPayment=TryCatch(
    async(req,res,next)=>{
        const {paymentid}=req.params;
        const payment=await UserPayment.findById(paymentid);
        if(!payment){
            return next(new ErrorHandler("No payment found with this ID",404));
        }
        if(payment.paymentStatus==="pending"){
            payment.paymentStatus="completed";
            await payment.save();
        }
        res.status(200).json({
            success:true,
            message:"Payment completed successfully"
        })
    }
)




