import mysql from "mysql2/promise";
import { env } from "./env.js";

export const dbPool = mysql.createPool({
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  connectionLimit: 10,
  charset: "utf8mb4"
});

export async function verifyDatabaseConnection() {
  const connection = await dbPool.getConnection();

  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}
