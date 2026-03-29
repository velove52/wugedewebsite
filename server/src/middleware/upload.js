import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { env } from "../config/env.js";

fs.mkdirSync(env.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, env.uploadDir);
  },
  filename: (_request, file, callback) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = ext || ".jpg";
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    callback(null, uniqueName);
  }
});

function fileFilter(_request, file, callback) {
  if (!file.mimetype.startsWith("image/")) {
    callback(new Error("只能上传图片文件"));
    return;
  }

  callback(null, true);
}

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: env.maxImageSizeBytes
  },
  fileFilter
});
