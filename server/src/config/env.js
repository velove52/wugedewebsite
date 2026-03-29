import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const currentFilePath = fileURLToPath(import.meta.url);
const configDir = path.dirname(currentFilePath);
const serverRootDir = path.resolve(configDir, "..", "..");

export const env = {
  port: Number(process.env.PORT || 3000),
  clientOrigin: process.env.CLIENT_ORIGIN || "*",
  dbHost: process.env.DB_HOST || "127.0.0.1",
  dbPort: Number(process.env.DB_PORT || 3306),
  dbUser: process.env.DB_USER || "root",
  dbPassword: process.env.DB_PASSWORD || "",
  dbName: process.env.DB_NAME || "music_site",
  uploadDir: path.resolve(serverRootDir, process.env.UPLOAD_DIR || "uploads"),
  maxImageSizeBytes: Number(process.env.MAX_IMAGE_SIZE_MB || 3) * 1024 * 1024
};
