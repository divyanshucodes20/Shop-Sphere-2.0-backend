import { TryCatch } from "../middlewares/error.js";
import Notification from "../models/notification.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility-class.js";



export const addNotification=TryCatch(
    async(req,res,next)=>{
        const {userId}=req.query
        if (!userId) return next(new ErrorHandler("Please login first", 401));
        const user=await User.findById(userId);

         if(!user) return next(new ErrorHandler("User with this id not found", 404));

        const {productId}=req.body
        if (!productId) return next(new ErrorHandler("Please product id not found", 400));
        const product = await Product.findById(productId);
        if (!product) return next(new ErrorHandler("Product not found", 404));
        const existingNotification = await Notification.findOne({ email: user.email, productId});

        if (existingNotification){
          return next(new ErrorHandler("Out of Stock! we  will notify you soon when it is in stock", 400));
        }
        const notification = await Notification.create({
            email: user.email,
            productId,
            productName: product.name,
        });
        res.status(201).json({ message: "Notification created successfully", notification});
    }
)
export const removeNotification = TryCatch(
    async (req, res, next) => {
      const { productId,email } = req.body;  
      if (!productId) return next(new ErrorHandler("Please provide product id", 400));
      if (!email) return next(new ErrorHandler("Please provide email", 400));
      const notification = await Notification.deleteOne({
        productId,
        email,
      });
      res.status(200).json({
        message: "Notifications removed successfully"
      });
    }
  );

export const getAllNotifications=TryCatch(
    async(req,res,next)=>{
        const notifications=await Notification.find();
        if(!notifications) return next(new ErrorHandler("No notifications found", 404));
        res.status(200).json({notifications})
    }
)
  