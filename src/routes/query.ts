import express from "express";
import {
    getQueriesByUserId,
    getAllAdminPickUps,
    getQueryById,
    getAllAdminQueries,
    newQuery,
    updateQueryStatus,
    deleteQuery,
    deleteUserQuery,
    updateUserQuery,getAdminPendingReUsableProducts
} from "../controllers/query.js";
import { adminOnly } from "../middlewares/auth.js";
import { mutliUpload } from "../middlewares/multer.js";

const router = express.Router();

router.get("/user", getQueriesByUserId);
router.put("/user/:id",mutliUpload, updateUserQuery);
router.delete("/user/:id", deleteUserQuery);
router.post("/new",mutliUpload ,newQuery);
router.get("/all", adminOnly, getAllAdminQueries);
router.get("/pickups", adminOnly, getAllAdminPickUps);
router.get("/pending", adminOnly, getAdminPendingReUsableProducts);
router.get("/:id", getQueryById);
router.put("/:id", adminOnly, updateQueryStatus);
router.delete("/:id", adminOnly, deleteQuery);



export default router;