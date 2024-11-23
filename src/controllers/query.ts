import { Request } from "express";
import { TryCatch } from "../middlewares/error.js";
import { ProductQuery } from "../models/query.js";
import ErrorHandler from "../utils/utility-class.js";
import { NewQueryRequestBody } from "../types/types.js";
import { User } from "../models/user.js";
import { sendQueryRejectionEmail } from "../utils/features.js";


export const getQueriesByUserId=TryCatch(
    async(req,res,next)=>{
        const {userId}=req.query;
        if(!userId){
            return next(new ErrorHandler("Login first to get queries",401));
        }
        const queries=await ProductQuery.find({userId});
        if(queries.length===0){
            return next(new ErrorHandler("No queries found",404));
        }
        res.status(200).json({
            success:true,
            queries
        })
    }
)

export const getQueryById=TryCatch(
    async(req,res,next)=>{
        const {id}=req.params;
        if(!id){
            return next(new ErrorHandler("No query found",404));
        }
        const query=await ProductQuery.findById(id);
        if(!query){
            return next(new ErrorHandler("No query found",404));
        }
        res.status(200).json({
            success:true,
            query
        })
    }
)

export const getAllAdminQueries=TryCatch(
    async(req,res,next)=>{
        const pendingQueries=await ProductQuery.find({queryStatus:"pending"});
        if(pendingQueries.length===0){
            return next(new ErrorHandler("No queries found",404));
        }
        res.status(200).json({
            success:true,
            pendingQueries
        })
    }
)
export const getAllAdminPickUps=TryCatch(
    async(req,res,next)=>{
        const  pickUps=await ProductQuery.find({queryStatus:"approved"});
        if(pickUps.length===0){
            return next(new ErrorHandler("No queries found",404));
        }
        res.status(200).json({
            success:true,
            pickUps
        })
    }
)
export const updateQueryStatus=TryCatch(
    async(req,res,next)=>{
        const {id}=req.params
        const query=await ProductQuery.findById(id);
        if(!query){
            return next(new ErrorHandler("No query found",404));
        }
        if(query.queryStatus==="pending"){
            query.queryStatus="approved";
        }
        else if(query.queryStatus==="approved"){
            query.queryStatus="success";
        }
        await query.save();
        res.status(200).json({
            success:true,
            message:"Query status updated successfully",
        })   
    }
)



export const newQuery=TryCatch(
    async(req: Request<{}, {}, NewQueryRequestBody>,res,next)=>{
        const {userId}=req.query;
        if(!userId){
            return next(new ErrorHandler("Login first to post a query",401));
        }
        const user=await User.findById(userId)
        if(!user){
            return next(new ErrorHandler("No user found",404));
        }
        if(user.role!=="user"){
            return next(new ErrorHandler("Only users can post queries",401));
        }
        const {
            productDetails: { name, category, description, price, stock, photos },
            pickupDetails: { pickupAddress, pickupCity, pickupPostalCode },
          } = req.body;
      
          if (!name || !category || !description || !price || !stock || !photos || photos.length === 0) {
            return next(new ErrorHandler("All product details are required", 400));
          }
      
          if (!pickupAddress || !pickupCity|| !pickupPostalCode) {
            return next(new ErrorHandler("Pickup address and city are required", 400));
          }
      
          const newQuery = new ProductQuery({
            userId,
            userEmail:user.email,
            productDetails: {
              name,
              category,
              description,
              price,
              stock,
              photos,
            },
            pickupDetails: {
              pickupAddress,
              pickupCity,
              pickupPostalCode
            },
          });
          await newQuery.save();
      
          res.status(201).json({
            success: true,
            message: "Query posted successfully",
            newQuery,
          });
    }
)


export const deleteQuery=TryCatch(
    async(req,res,next)=>{
        const {id}=req.params;
        if(!id){
            return next(new ErrorHandler("No query found",404));
        }
        const query=await ProductQuery.findById(id);
        if(!query){
            return next(new ErrorHandler("No query found",404));
        }
        await sendQueryRejectionEmail(query.userEmail,query.productDetails?.name!,id);
        await query.deleteOne();
        res.status(200).json({
            success:true,
            message:"Query deleted successfully"
        })
    }
)