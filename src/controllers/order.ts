import { Request } from "express";
import { redis, redisTTL } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { NewOrderRequestBody } from "../types/types.js";
import { checkStockOfReUsableProductAndDelete, invalidateCache, reduceStock } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";
import { ReUsableProduct } from "../models/reUsable.js";
import { UserPayment } from "../models/userPayment.js";

export const myOrders = TryCatch(async (req, res, next) => {
  const { id: user } = req.query;

  const key = `my-orders-${user}`;

  let orders;

  orders = await redis.get(key);

  if (orders) orders = JSON.parse(orders);
  else {
    orders = await Order.find({ user });
    await redis.setex(key, redisTTL, JSON.stringify(orders));
  }
  return res.status(200).json({
    success: true,
    orders,
  });
});

export const allOrders = TryCatch(async (req, res, next) => {
  const key = `all-orders`;

  let orders;

  orders = await redis.get(key);

  if (orders) orders = JSON.parse(orders);
  else {
    orders = await Order.find().populate("user", "name");
    await redis.setex(key, redisTTL, JSON.stringify(orders));
  }
  return res.status(200).json({
    success: true,
    orders,
  });
});

export const getSingleOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const key = `order-${id}`;

  let order;
  order = await redis.get(key);

  if (order) order = JSON.parse(order);
  else {
    order = await Order.findById(id).populate("user", "name");

    if (!order) return next(new ErrorHandler("Order Not Found", 404));

    await redis.setex(key, redisTTL, JSON.stringify(order));
  }
  return res.status(200).json({
    success: true,
    order,
  });
});

export const newOrder = TryCatch(
  async (req: Request<{}, {}, NewOrderRequestBody>, res, next) => {
    const {
      shippingInfo,
      orderItems,
      user,
      subtotal,
      tax,
      shippingCharges,
      discount,
      total,
    } = req.body;

    if (!shippingInfo || !orderItems || !user || !subtotal || !tax || !total) {
      return next(new ErrorHandler("Please Enter All Fields", 400));
    }

    if (orderItems.length === 0) {
      return next(new ErrorHandler("Please Add Items to Order", 400));
    }

    const reusableData = await Promise.all(
      orderItems.map(async (item) => {
        const reusableProduct = await ReUsableProduct.findById(item.productId);

        if (reusableProduct) {
          // Check stock and handle deletion or stock reduction
          await checkStockOfReUsableProductAndDelete(item.productId, item.quantity);

          // Use virtual property `totalPrice` to calculate total amount
          const totalAmount = (reusableProduct.totalPrice ?? 0) * item.quantity;
          const totalCommission = reusableProduct.commission * item.quantity;

          // Create pending payment entry for the reusable product
          await UserPayment.create({
            userId: reusableProduct.userId,
            reusableProductId: item.productId,
            amount: totalAmount - totalCommission, // Pending payment for the user
          });

          return {
            item,
            commission: reusableProduct.commission,
            totalAmount,
          };
        }

        return null;
      })
    );

    const filteredReUsables = reusableData.filter(Boolean);

    // Create the order
    const order = await Order.create({
      shippingInfo,
      orderItems,
      user,
      subtotal,
      tax,
      shippingCharges,
      discount,
      total,
    });

    // Reduce stock for non-reusable products
    const nonReusableItems = orderItems.filter(
      (item) =>
        !filteredReUsables.find((reusable) => reusable?.item.productId === item.productId)
    );

    if (nonReusableItems.length > 0) {
      await reduceStock(nonReusableItems);
    }

    // Invalidate cache for relevant entities
    await invalidateCache({
      product: true,
      order: true,
      admin: true,
      userId: user,
      productId: order.orderItems.map((i) => String(i.productId)),
    });

    return res.status(201).json({
      success: true,
      message: "Order Placed Successfully",
    });
  }
);



export const processOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id);

  if (!order) return next(new ErrorHandler("Order Not Found", 404));

  switch (order.status) {
    case "Processing":
      order.status = "Shipped";
      break;
    case "Shipped":
      order.status = "Delivered";
      break;
    default:
      order.status = "Delivered";
      break;
  }

  await order.save();

  await invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });

  return res.status(200).json({
    success: true,
    message: "Order Processed Successfully",
  });
});

export const deleteOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id);
  if (!order) return next(new ErrorHandler("Order Not Found", 404));

  await order.deleteOne();

  await invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });

  return res.status(200).json({
    success: true,
    message: "Order Deleted Successfully",
  });
});
