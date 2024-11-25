import { Request } from "express";
import { TryCatch } from "../middlewares/error.js";
import { ProductQuery } from "../models/query.js";
import ErrorHandler from "../utils/utility-class.js";
import { NewQueryRequestBody } from "../types/types.js";
import { User } from "../models/user.js";
import { deleteFromCloudinary, sendQueryRejectionEmail, uploadToCloudinary } from "../utils/features.js";


export const getQueriesByUserId=TryCatch(
    async(req,res,next)=>{
        const {userId}=req.query;
        if(!userId){
            return next(new ErrorHandler("Login first to get queries",401));
        }
        const user=await User.findById(userId)
        if(!user){
            return next(new ErrorHandler("No user found",404));
        }
        if(user.role!=="user"){
            return next(new ErrorHandler("Only users can post queries",401));
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
        const queries=await ProductQuery.find({queryStatus:"pending"});
        if(queries.length===0){
            return next(new ErrorHandler("No queries found",404));
        }
        res.status(200).json({
            success:true,
            queries
        })
    }
)
export const getAllAdminPickUps=TryCatch(
    async(req,res,next)=>{
        const  queries=await ProductQuery.find({queryStatus:"approved"});
        if(queries.length===0){
            return next(new ErrorHandler("No queries found",404));
        }
        res.status(200).json({
            success:true,
            queries
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

export const getAdminPendingReUsableProducts=TryCatch(
    async(req,res,next)=>{
        const queries=await ProductQuery.find({queryStatus:"success"});
        if(queries.length===0){
            return next(new ErrorHandler("No Pending Products  found",404));
        }
        res.status(200).json({
            success:true,
            queries
        })
    }
)








export const newQuery = TryCatch(
  async (req: Request<{}, {}, NewQueryRequestBody>, res, next) => {
    const {userId}=req.query
    const { name, price, stock, category, description,pickupAddress,
        pickupCity,pickupPostalCode
     } = req.body;
    

    const photos = req.files as Express.Multer.File[] | undefined;

    if (!photos || photos.length === 0) {
      return next(new ErrorHandler("Please upload at least one photo", 400));
    }
    if(photos.length>5){
        return next(new ErrorHandler("Cannot upload more than 5 photos",400));
    }
    if (!name || !price || !stock || !category || !description || !pickupAddress || !pickupCity || !pickupPostalCode)
        return next(new ErrorHandler("Please enter All Fields", 400));

    const photosURL = await uploadToCloudinary(photos);

    await   ProductQuery.create({
      productDetails:{
      name,
      price,
      description,
      stock,
      category: category.toLowerCase(),
      photos: photosURL,
      },
        pickupDetails:{
            pickupAddress,
            pickupCity,
            pickupPostalCode
        },
        userId,
    });

    return res.status(201).json({
      success: true,
      message: "Query Created Successfully",
    });
  }
);

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
        const userId=query.userId;
        const user=await User.findById(userId);
        if (user?.email && query.productDetails?.name) {
            await sendQueryRejectionEmail(user.email, query.productDetails.name);
        } else {
            return next(new ErrorHandler("User email or product name is missing", 400));
        }

        const ids = query.productDetails?.photos.map((photo) => photo.public_id);

          if(ids) await deleteFromCloudinary(ids);
        await query.deleteOne();
        res.status(200).json({
            success:true,
            message:"Query deleted successfully"
        })
    }
)

export const deleteUserQuery=TryCatch(
    async(req,res,next)=>{
        const {id}=req.params;
        const {userId}=req.query;
        if(!userId){
            return next(new ErrorHandler("Login first to delete a query",401));
        }
        if(!id){
            return next(new ErrorHandler("No query found",404));
        }
        const query=await ProductQuery.findById(id);
        if(!query){
            return next(new ErrorHandler("No query found",404));
        }
        if(query.userId!==userId){
            return next(new ErrorHandler("Unauthorized to delete this query",401));
        }
        if(query.queryStatus!=="pending"){
            return next(new ErrorHandler("Cannot delete queries that are approved",400));
        }
        const ids = query.productDetails?.photos.map((photo) => photo.public_id);

          if(ids) await deleteFromCloudinary(ids);
        await query.deleteOne();
        res.status(200).json({
            success:true,
            message:"Query deleted successfully"
        })
    }
)

export const updateUserQuery = TryCatch(
    async (req, res, next) => {
      const { id } = req.params; // Get the query ID from the route parameters
      const { userId } = req.query; // Get the user ID from the request body
  
      // Check if user is logged in
      if (!userId) {
        return next(new ErrorHandler("Login first to update a query", 401));
      }
  
      // Check if query ID is provided
      if (!id) {
        return next(new ErrorHandler("No query found", 404));
      }
  
      // Find the query by ID
      const query = await ProductQuery.findById(id);
      if (!query) {
        return next(new ErrorHandler("No query found", 404));
      }
  
      // Check if the query belongs to the logged-in user
      if (query.userId !== userId) {
        return next(new ErrorHandler("Unauthorized to update this query", 401));
      }
  
      // Ensure only pending queries can be updated
      if (query.queryStatus !== "pending") {
        return next(new ErrorHandler("Cannot update queries that are approved", 400));
      }
  
      // Destructure product details and pickup details from request body
      const {
        name,description,price,stock,category,pickupAddress,pickupCity,pickupPostalCode
      } = req.body;
  
      // Check for uploaded photos and handle Cloudinary uploads
      const photos = req.files as Express.Multer.File[] | undefined;
      if (photos && photos.length > 0) {
        const photosURL = await uploadToCloudinary(photos);
  
        // Delete old Cloudinary images if present
        const ids = query.productDetails?.photos.map((photo) => photo.public_id);
        if (ids) await deleteFromCloudinary(ids);
  
        // Update the photos in the query object
        if (query.productDetails) {
          query.productDetails.photos = photosURL;
        }
      }
  
      // Update query fields if they are provided in the request body
      if (name) query.productDetails!.name = name;
      if (category) query.productDetails!.category = category;
      if (description) query.productDetails!.description = description;
      if (price) query.productDetails!.price = price;
      if (stock) query.productDetails!.stock = stock;
      if (pickupAddress) query.pickupDetails!.pickupAddress = pickupAddress;
      if (pickupCity) query.pickupDetails!.pickupCity = pickupCity;
      if (pickupPostalCode) query.pickupDetails!.pickupPostalCode = pickupPostalCode;
  
      // Save the updated query
      await query.save();
  
      // Send a success response
      res.status(200).json({
        success: true,
        message: "Query updated successfully",
      });
    }
  );
  


