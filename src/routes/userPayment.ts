import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import {getAllPendingPayments,getPaymentById,getUserPendingPayments,processPayment,getUserCompletedPayments,getUserPayments} from "../controllers/userPayment.js";



const router = express.Router();

router.get("/pending", adminOnly, getAllPendingPayments);
router.get("/pending/:id", adminOnly, getPaymentById);
router.put("/pending/:id", adminOnly, processPayment);
router.get("/user/pending",getUserPendingPayments);
router.get("/user/completed",getUserCompletedPayments);
router.get("/user",getUserPayments);

export default router;