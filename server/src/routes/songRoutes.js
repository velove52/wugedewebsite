import { Router } from "express";
import { getSongs } from "../controllers/songController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(getSongs));

export default router;
