import { Router } from "express";
import { uploadImage } from "../controllers/uploadController.js";
import { uploadMiddleware } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/", uploadMiddleware.single("image"), asyncHandler(uploadImage));

export default router;
