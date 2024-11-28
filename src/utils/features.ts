import { UploadApiResponse, v2 as cloudinary } from "cloudinary";
import { Redis } from "ioredis";
import mongoose, { Document } from "mongoose";
import { redis, resend } from "../app.js";
import { Product } from "../models/product.js";
import { Review } from "../models/review.js";
import { InvalidateCacheProps, OrderItemType } from "../types/types.js";
import { ReUsableProduct } from "../models/reUsable.js";
import { ProductQuery } from "../models/query.js";
import { UserPayment } from "../models/userPayment.js";
import { sendProductDeletionEmailDueToShortage } from "./emails.js";
import { User } from "../models/user.js";



export const findAverageRatings = async (
  productId: mongoose.Types.ObjectId
) => {
  let totalRating = 0;

  const reviews = await Review.find({ product: productId });
  reviews.forEach((review) => {
    totalRating += review.rating;
  });

  const averateRating = Math.floor(totalRating / reviews.length) || 0;

  return {
    numOfReviews: reviews.length,
    ratings: averateRating,
  };
};

const getBase64 = (file: Express.Multer.File) =>
  `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

export const uploadToCloudinary = async (files: Express.Multer.File[]) => {
  const promises = files.map(async (file) => {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload(getBase64(file), (error, result) => {
        if (error) return reject(error);
        resolve(result!);
      });
    });
  });

  const result = await Promise.all(promises);

  return result.map((i) => ({
    public_id: i.public_id,
    url: i.secure_url,
  }));
};

export const deleteFromCloudinary = async (publicIds: string[]) => {
  const promises = publicIds.map((id) => {
    return new Promise<void>((resolve, reject) => {
      cloudinary.uploader.destroy(id, (error, result) => {
        if (error) return reject(error);
        resolve();
      });
    });
  });

  await Promise.all(promises);
};

export const connectRedis = (redisURI: string) => {
  const redis = new Redis(redisURI);

  redis.on("connect", () => console.log("Redis Connected"));
  redis.on("error", (e) => console.log(e));

  return redis;
};

export const connectDB = (uri: string) => {
  mongoose
    .connect(uri, {
      dbName: "Shop_Sphere",
    })
    .then((c) => console.log(`DB Connected to ${c.connection.host}`))
    .catch((e) => console.log(e));
};

export const invalidateCache = async ({
  product,
  order,
  admin,
  review,
  userId,
  orderId,
  productId,
  reUsableProduct,
  reUsableProductId
}: InvalidateCacheProps) => {
  if (review) {
    await redis.del([`reviews-${productId}`]);
  }

  if (product) {
    const productKeys: string[] = [
      "latest-products",
      "categories",
      "all-products",
    ];

    if (typeof productId === "string") productKeys.push(`product-${productId}`);

    if (typeof productId === "object")
      productId.forEach((i) => productKeys.push(`product-${i}`));

    await redis.del(productKeys);
  }
  if(reUsableProduct){
    const productKeys: string[] = [
      "latest-reusable-products",
      "reusable-categories",
      "all-resuable-products",
    ];

    if (typeof reUsableProductId === "string") productKeys.push(`reusable-product-${reUsableProductId}`);

    if (typeof reUsableProductId === "object")
      reUsableProductId.forEach((i) => productKeys.push(`reusable-product-${i}`));

    await redis.del(productKeys);
  }
  if (order) {
    const ordersKeys: string[] = [
      "all-orders",
      `my-orders-${userId}`,
      `order-${orderId}`,
    ];

    await redis.del(ordersKeys);
  }
  if (admin) {
    await redis.del([
      "admin-stats",
      "admin-pie-charts",
      "admin-bar-charts",
      "admin-line-charts",
    ]);
  }
};
export const checkStockOfReUsableProductAndDelete = async (
  productId: string,
  quantity: number
) => {
  const product = await ReUsableProduct.findById(productId);

  if (!product) return;

  if (product.productDetails?.stock === quantity) {
    const ids = product.productDetails?.photos.map((photo) => photo.public_id);

    if (ids && ids.length > 0) {
      await deleteFromCloudinary(ids);
    }
    const user=await User.findById(product.userId);
    sendProductDeletionEmailDueToShortage(user?.email!, product.productDetails?.name!);
    await product.deleteOne();
  } else {
    product.productDetails!.stock -= quantity;
    await product.save();
  }

  await invalidateCache({
    reUsableProduct: true,
    reUsableProductId: String(product._id),
  });
};
export const reduceStock = async (orderItems: OrderItemType[]) => {
  for (let i = 0; i < orderItems.length; i++) {
    const order = orderItems[i];
    const product = await Product.findById(order.productId);
    if (!product) throw new Error("Product Not Found");
    product.stock -= order.quantity;
    await product.save();
  }
};

export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
  if (lastMonth === 0) return thisMonth * 100;
  const percent = (thisMonth / lastMonth) * 100;
  return Number(percent.toFixed(0));
};

export const getInventories = async ({
  categories,
  productsCount,
}: {
  categories: string[];
  productsCount: number;
}) => {
  const categoriesCountPromise = categories.map((category) =>
    Product.countDocuments({ category })
  );

  const categoriesCount = await Promise.all(categoriesCountPromise);

  const categoryCount: Record<string, number>[] = [];

  categories.forEach((category, i) => {
    categoryCount.push({
      [category]: Math.round((categoriesCount[i] / productsCount) * 100),
    });
  });

  return categoryCount;
};

interface MyDocument extends Document {
  createdAt: Date;
  discount?: number;
  total?: number;
}
type FuncProps = {
  length: number;
  docArr: MyDocument[];
  today: Date;
  property?: "discount" | "total";
};

export const getChartData = ({
  length,
  docArr,
  today,
  property,
}: FuncProps) => {
  const data: number[] = new Array(length).fill(0);

  docArr.forEach((i) => {
    const creationDate = i.createdAt;
    const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

    if (monthDiff < length) {
      if (property) {
        data[length - monthDiff - 1] += i[property]!;
      } else {
        data[length - monthDiff - 1] += 1;
      }
    }
  });

  return data;
};


export const sendNotificationEmail = async (email: string, productName: string) => {
  try {
    await resend.emails.send({
      from: "ShopSphere <no-reply@divyanshucodings.live>",
      to: email,
      subject: "Product Back in Stock!",
      html: `<p>The product <b>${productName}</b> is now back in stock! Order now before it runs out again.</p>`,
    });
  } catch (error) {
    console.error(`Failed to send notification email to ${email}:`, error);
  }
};


export const sendQueryRejectionEmail = async (email: string,productName:string) => {
   
try {
 
  await resend.emails.send({
    from: "ShopSphere <no-reply@divyanshucodings.live>",
    to: email,
    subject: "Query Rejected",
    html: `<p>Your query regarding the product <b>${productName}</b> has been rejected.Sorry we are not forwarding your product to our shop</p>`,
  });
} catch (error) {
  console.error(`Failed to send notification email to ${email}:`, error);
}


}

export const sendProductAcceptanceEmail = async (email: string,productName:string) => {
   
  try {
   
    await resend.emails.send({
    from: "ShopSphere <no-reply@divyanshucodings.live>",
    to: email,
    subject: "Product Accepted",
    html: `<p>Congratulations! Your product <b>${productName}</b> has been accepted and will be forwarded to our shop 
    Please send your bank details by contacting us from the contact us page to get your payment
    when your product is sold.Please set subject as "Payment Details" and send your bank details in the message body.Thank you!
    </p>`,});
  } catch (error) {
    console.error(`Failed to send notification email to ${email}:`, error);
  }
    
}
