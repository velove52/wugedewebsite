import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { env } from "./config/env.js";
import { verifyDatabaseConnection } from "./config/db.js";
import messageRoutes from "./routes/messageRoutes.js";
import songRoutes from "./routes/songRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

const app = express();

fs.mkdirSync(env.uploadDir, { recursive: true });

app.use(
  cors({
    origin: env.clientOrigin === "*" ? true : env.clientOrigin
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(env.uploadDir));

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true
  });
});

app.use("/api/songs", songRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/uploads", uploadRoutes);

app.use((error, _request, response, _next) => {
  if (error.code === "LIMIT_FILE_SIZE") {
    response.status(400).json({
      error: "图片不能超过 3MB"
    });
    return;
  }

  const statusCode = error.statusCode || 500;
  response.status(statusCode).json({
    error: error.message || "服务器内部错误"
  });
});

async function startServer() {
  await verifyDatabaseConnection();

  app.listen(env.port, () => {
    const uploadFolderName = path.basename(env.uploadDir);
    console.log(`Server listening on http://localhost:${env.port}`);
    console.log(`Static uploads served from /${uploadFolderName}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
