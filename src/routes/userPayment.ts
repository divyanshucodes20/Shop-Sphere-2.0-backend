import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import {getAllPendingPayments,getPaymentById,getUserPendingPayments,processPayment,getUserCompletedPayments,getUserPayments, getAdminCompletedPayments, getAdminAllPayments} from "../controllers/userPayment.js";



const router = express.Router();

router.get("/pending", adminOnly, getAllPendingPayments);
router.get("/pending/:paymentid", adminOnly, getPaymentById);
router.put("/pending/:paymentid", adminOnly, processPayment);
router.get("/completed", adminOnly,getAdminCompletedPayments);
router.get("/all", adminOnly, getAdminAllPayments);


router.get("/user/pending",getUserPendingPayments);
router.get("/user/completed",getUserCompletedPayments);
router.get("/user",getUserPayments);

export default router;