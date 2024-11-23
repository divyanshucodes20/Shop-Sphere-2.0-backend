import express from "express";
import { addNotification, getAllNotifications, removeNotification } from "../controllers/notification.js";
import { adminOnly } from "../middlewares/auth.js";

const router = express.Router();


router.post("/new",addNotification);
router.get("/all",adminOnly,getAllNotifications);
router.delete("/",adminOnly,removeNotification);


export default router;