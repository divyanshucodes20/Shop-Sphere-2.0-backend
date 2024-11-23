import express from "express";
import {getAdminReUsableProducts,getAllReUSableProducts,getAllReUsableCategories,
    getSingleReUsableProduct,getlatestReUsableProducts,newReUsableProduct,updateReUsableProduct,deleteReUsableProduct
} from "../controllers/reUsable.js";
import { adminOnly } from "../middlewares/auth.js";



const router = express.Router();

router.get("/all", getAllReUSableProducts);
router.get("/admin/all", getAdminReUsableProducts);
router.get("/categories", getAllReUsableCategories);
router.get("/latest", getlatestReUsableProducts);
router.post("/new", adminOnly, newReUsableProduct);
router.get("/:id", getSingleReUsableProduct);
router.put("/:id", adminOnly, updateReUsableProduct);
router.delete("/:id", adminOnly, deleteReUsableProduct);



export default router;