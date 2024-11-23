import express from "express";
import { connectDB, connectRedis } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";
import { config } from "dotenv";
import morgan from "morgan";
import Stripe from "stripe";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import { Resend } from 'resend';
// Importing Routes
import userRoute from "./routes/user.js";
import productRoute from "./routes/products.js";
import orderRoute from "./routes/order.js";
import paymentRoute from "./routes/payment.js";
import dashboardRoute from "./routes/stats.js";
import notificationRoute from "./routes/notification.js";
import queryRoute from "./routes/query.js";
import userPaymentRoute from "./routes/userPayment.js";
import ReUsableProductRoute from "./routes/reUsable.js";
import rateLimiter from "./middlewares/rateLimiter.js";

config({
  path: "./.env",
});

const port = process.env.PORT || 4000;
const mongoURI = process.env.MONGO_URI || "";
const stripeKey = process.env.STRIPE_KEY || "";
const redisURI = process.env.REDIS_URI || "";
const clientURL = process.env.CLIENT_URL || "";
export const redisTTL = process.env.REDIS_TTL || 60 * 60 * 4;

connectDB(mongoURI);
export const redis = connectRedis(redisURI);

export const resend = new Resend(process.env.RESEND_KEY);

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

export const stripe = new Stripe(stripeKey);

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("API Working with /api/v1");
});

app.use(rateLimiter);

// Using Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/dashboard", dashboardRoute);
app.use("/api/v1/notification",notificationRoute);
app.use("/api/v1/query",queryRoute);
app.use("/api/v1/userPayment", userPaymentRoute);
app.use("/api/v1/reusable-product", ReUsableProductRoute);

app.use("/uploads", express.static("uploads"));
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Express is working on http://localhost:${port}`);
});
