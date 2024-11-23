import express from "express";
import {
    getQueriesByUserId,
    getAllAdminPickUps,
    getQueryById,
    getAllAdminQueries,
    newQuery,
    updateQueryStatus,
    deleteQuery
} from "../controllers/query.js";
import { adminOnly } from "../middlewares/auth.js";

const router = express.Router();

router.get("/user/:userId", getQueriesByUserId);
router.get("/pickups", adminOnly, getAllAdminPickUps);
router.get("/all", adminOnly, getAllAdminQueries);
router.post("/new", newQuery);
router.get("/:id", getQueryById);
router.put("/:id", adminOnly, updateQueryStatus);
router.delete("/:id", adminOnly, deleteQuery);


export default router;