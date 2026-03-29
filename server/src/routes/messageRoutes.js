import { Router } from "express";
import { getMessages, postMessage, postReply } from "../controllers/messageController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(getMessages));
router.post("/", asyncHandler(postMessage));
router.post("/:messageId/replies", asyncHandler(postReply));

export default router;
