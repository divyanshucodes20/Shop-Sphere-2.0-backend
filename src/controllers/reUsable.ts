import { Request } from "express";
import { redis, redisTTL } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import {
  BaseQuery,
  NewReUsableProductRequestBody,
  SearchRequestQuery,
} from "../types/types.js";
import {
  deleteFromCloudinary,
  invalidateCache,
  sendProductAcceptanceEmail,
  uploadToCloudinary,
} from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";
import { ReUsableProduct } from "../models/reUsable.js";
import { ProductQuery } from "../models/query.js";
import { sendProductDeletionEmail } from "../utils/emails.js";


export const getlatestReUsableProducts = TryCatch(async (req, res, next) => {
  let products;

  products = await redis.get("latest-reusable-products");

  if (products) products = JSON.parse(products);
  else {
    products = await ReUsableProduct.find({}).sort({ createdAt: -1 }).limit(5);
    await redis.setex("latest-reusable-products", redisTTL, JSON.stringify(products));
  }

  return res.status(200).json({
    success: true,
    products,
  });
});

export const getAllReUsableCategories = TryCatch(async (req, res, next) => {
  let categories;

  categories = await redis.get("reusable-categories");

  if (categories) categories = JSON.parse(categories);
  else {
    categories = await ReUsableProduct.distinct("category");
    await redis.setex("reusable-categories", redisTTL, JSON.stringify(categories));
  }

  return res.status(200).json({
    success: true,
    categories,
  });
});

export const getSingleReUsableProduct = TryCatch(async (req, res, next) => {
  let product;
  const id = req.params.id;
  const key = `reusable-product-${id}`;

  product = await redis.get(key);
  if (product) product = JSON.parse(product);
  else {
    product = await ReUsableProduct.findById(id);
    if (!product) return next(new ErrorHandler("Product Not Found", 404));

    await redis.setex(key, redisTTL, JSON.stringify(product));
  }

  return res.status(200).json({
    success: true,
    product,
  });
});

export const getAllReUSableProducts = TryCatch(
  async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
    const { search, sort, category, price } = req.query;

    const page = Number(req.query.page) || 1;

    const key = `reusable-products-${search}-${sort}-${category}-${price}-${page}`;

    let products;
    let totalPage;

    const cachedData = await redis.get(key);
    if (cachedData) {
      const data = JSON.parse(cachedData);
      totalPage = data.totalPage;
      products = data.products;
    } else {
      // 1,2,3,4,5,6,7,8
      // 9,10,11,12,13,14,15,16
      // 17,18,19,20,21,22,23,24
      const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
      const skip = (page - 1) * limit;

      const baseQuery: BaseQuery = {};

      if (search)
        baseQuery.name = {
          $regex: search,
          $options: "i",
        };

      if (price)
        baseQuery.price = {
          $lte: Number(price),
        };

      if (category) baseQuery.category = category;

      const productsPromise = ReUsableProduct.find(baseQuery)
        .sort(sort && { price: sort === "asc" ? 1 : -1 })
        .limit(limit)
        .skip(skip);

      const [productsFetched, filteredOnlyProduct] = await Promise.all([
        productsPromise,
        ReUsableProduct.find(baseQuery),
      ]);

      products = productsFetched;
      totalPage = Math.ceil(filteredOnlyProduct.length / limit);

      await redis.setex(key, 30, JSON.stringify({ products, totalPage }));
    }

    return res.status(200).json({
      success: true,
      products,
      totalPage,
    });
  }
);

export const getAdminReUsableProducts = TryCatch(async (req, res, next) => {
  const products = await ReUsableProduct.find({});
   
  if (!products) return next(new ErrorHandler("No Products Found", 404));
  if(products.length === 0) return next(new ErrorHandler("No Products Found", 404));

  return res.status(200).json({
    success: true,
    products,
  });
});


export const newReUsableProduct = TryCatch(
  async (req: Request, res, next) => {
    const {
      userId,
      commission,
    } = req.body;
    let productDetails;
    try {
      productDetails = JSON.parse(req.body.productDetails);
    } catch (error) {
      return next(new ErrorHandler("Invalid Product Details", 400));
    }

    const { name, price, stock, category, description } = productDetails;

    const photos = req.files as Express.Multer.File[] | undefined;

    if (!photos) return next(new ErrorHandler("Please add Photo", 400));
    if (!name || !price || !stock || !category || !description)
      return next(new ErrorHandler("Please enter All Fields", 400));

    // Check for an existing query with a status of "success"
    const query = await ProductQuery.findOne({ userId, status: "success" });
    if (query) {
      // Get all public IDs of photos from the query
      const ids = query.productDetails?.photos.map((photo) => photo.public_id);

      if (ids && ids.length > 0) {
        // Delete all photos from Cloudinary
        await deleteFromCloudinary(ids);
      }
      if (query.productDetails?.name) {
        await sendProductAcceptanceEmail(query.userId, query.productDetails.name);
      }
      // Remove the query after handling its photos
      await ProductQuery.findByIdAndDelete(query._id);
    }

    // Upload new photos to Cloudinary
    const photosURL = await uploadToCloudinary(photos);

    // Create the new ReUsableProduct
    await ReUsableProduct.create({
      productDetails: {
        name,
        price,
        description,
        stock,
        category: category.toLowerCase(),
        photos: photosURL,
      },
      userId,
      commission,
    });

    // Invalidate the cache for reusable products
    await invalidateCache({ reUsableProduct: true });

    return res.status(201).json({
      success: true,
      message: "ReUsableProduct Created Successfully",
    });
  }
);


export const updateReUsableProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const {productDetails:{
    name,
    price,
    stock,
    category,
    description,
  },commission } = req.body;
  const photos = req.files as Express.Multer.File[] | undefined;

  const product = await ReUsableProduct.findById(id);
  
  if (!product) return next(new ErrorHandler("Product Not Found", 404));

  if (photos && photos.length > 0) {
    const photosURL = await uploadToCloudinary(photos);

    const ids = product.productDetails?.photos.map((photo) => photo.public_id);

    if (ids) {
      await deleteFromCloudinary(ids);
    }

    if (product.productDetails) {
      product.productDetails.photos = photosURL;
    }
  }

  if (name && product.productDetails) product.productDetails.name = name;
  if (price && product.productDetails) product.productDetails.price = price;
  if (stock && product.productDetails) product.productDetails.stock = stock;
  if (category && product.productDetails) product.productDetails.category = category;
  if (description && product.productDetails) product.productDetails.description = description;
  if (commission) product.commission = commission;

  await product.save();

  await invalidateCache({
  reUsableProduct:true,
  reUsableProductId: String(product._id),
  });

  return res.status(200).json({
    success: true,
    message: "ReUsableProduct Updated Successfully",
  });
});

export const deleteReUsableProduct = TryCatch(async (req, res, next) => {
  const product = await ReUsableProduct.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product Not Found", 404));

  const ids = product.productDetails?.photos.map((photo) => photo.public_id);

  if (ids && ids.length > 0) {
    await deleteFromCloudinary(ids);
  }

   sendProductDeletionEmail(product.userId, product.productDetails?.name!);

  // Delete the product directly since queries were already handled earlier
  await product.deleteOne();

  await invalidateCache({
    reUsableProduct: true,
    reUsableProductId: String(product._id),
  });

  return res.status(200).json({
    success: true,
    message: "Product Deleted Successfully",
  });
});


export const getUserReUsableProducts = TryCatch(async (req, res, next) => {
  const {userId}=req.query;
  if(!userId) return next(new ErrorHandler("Please provide userId", 400));
  const products = await ReUsableProduct.find({userId});
  if (!products) return next(new ErrorHandler("No Products Found", 404));
  if(products.length === 0) return next(new ErrorHandler("No Products Found", 404));
  
  return res.status(200).json({
    success: true,
    products
  });

});





