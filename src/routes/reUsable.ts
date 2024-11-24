import express from "express";
import {getAdminReUsableProducts,getAllReUSableProducts,getAllReUsableCategories,
    getSingleReUsableProduct,getlatestReUsableProducts,newReUsableProduct,updateReUsableProduct,deleteReUsableProduct,getUserReUsableProducts
} from "../controllers/reUsable.js";
import { adminOnly } from "../middlewares/auth.js";
import { mutliUpload } from "../middlewares/multer.js";



const router = express.Router();

router.get("/user/all", getUserReUsableProducts);
router.get("/all", getAllReUSableProducts);
router.get("/admin/all", getAdminReUsableProducts);
router.get("/categories", getAllReUsableCategories);
router.get("/latest", getlatestReUsableProducts);
router.post("/new", adminOnly,mutliUpload, newReUsableProduct);
router.get("/:id", getSingleReUsableProduct);
router.put("/:id", adminOnly,mutliUpload, updateReUsableProduct);
router.delete("/:id", adminOnly, deleteReUsableProduct);



export default router;