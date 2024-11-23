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
  uploadToCloudinary,
} from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";
import { ReUsableProduct } from "../models/reUsable.js";

// Revalidate on New,Update,Delete Product & on New Order
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

// Revalidate on New,Update,Delete Product & on New Order
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

// Revalidate on New,Update,Delete Product & on New Order
export const getAdminReUsableProductQueries = TryCatch(async (req, res, next) => {
  let products;

  products = await redis.get("all-reusable-products");

  if (products) products = JSON.parse(products);
  else {
    products = await ReUsableProduct.find({});
    await redis.setex("all-reusable-products", redisTTL, JSON.stringify(products));
  }

  return res.status(200).json({
    success: true,
    products,
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

export const newReUsableProduct = TryCatch(
  async (req: Request<{}, {}, NewReUsableProductRequestBody>, res, next) => {
    const { name, price, stock, category, description,userId,userName } = req.body;
    const photos = req.files as Express.Multer.File[] | undefined;

    if (!photos) return next(new ErrorHandler("Please add Photo", 400));

    if (photos.length < 1)
      return next(new ErrorHandler("Please add atleast one Photo", 400));

    if (photos.length > 5)
      return next(new ErrorHandler("You can only upload 5 Photos", 400));

    if (!name || !price || !stock || !category || !description)
      return next(new ErrorHandler("Please enter All Fields", 400));

    // Upload Here
    if(!userId || !userName) return next(new ErrorHandler("Please Login to add Product", 400));

    const photosURL = await uploadToCloudinary(photos);

    await ReUsableProduct.create({
      name,
      price,
      description,
      stock,
      category: category.toLowerCase(),
      photos: photosURL,
      userId,
     userName
    });

    await invalidateCache({ reUsableProduct: true});

    return res.status(201).json({
      success: true,
      message: "Product Creation Request Sent Successfully",
    });
  }
);



export const deleteReUsableProductQuery = TryCatch(async (req, res, next) => {
  const product = await ReUsableProduct.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product Not Found", 404));

  const ids = product.photos.map((photo) => photo.public_id);

  await deleteFromCloudinary(ids);
   

  await product.deleteOne();

  await invalidateCache({
    reUsableProduct: true,
    reUsableProductId: String(product._id),
    admin: true,
  });

  return res.status(200).json({
    success: true,
    message: "Product Query Deleted Successfully",
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

export const deleteReUsableProductCreationRequest = TryCatch(
    async (req, res, next) => {
     
    

    }
)


