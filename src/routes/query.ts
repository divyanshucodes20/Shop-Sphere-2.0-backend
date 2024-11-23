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

const router = express.Router();

router.get("/user/query", getQueriesByUserId);
router.put("/user/query/:id", updateUserQuery);
router.delete("/user/query/:id", deleteUserQuery);
router.post("/new", newQuery);
router.get("/:id", getQueryById);
router.get("/pickups", adminOnly, getAllAdminPickUps);
router.get("/all", adminOnly, getAllAdminQueries);
router.put("/:id", adminOnly, updateQueryStatus);
router.delete("/:id", adminOnly, deleteQuery);
router.get("/pending", adminOnly, getAdminPendingReUsableProducts);


export default router;