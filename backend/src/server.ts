import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDatabase } from "./config/database";

const PORT = Number(process.env.PORT) || 5000;

void connectDatabase().catch((error: unknown) => {
  console.error("[database] connection failed:", error);
});

app.listen(PORT, () => {
  console.log("=================================");
  console.log("CareLink Backend Started");
  console.log(`Server : http://localhost:${PORT}`);
  console.log(`Health : http://localhost:${PORT}/health`);
  console.log(`Readiness : http://localhost:${PORT}/api/health/ready`);
  console.log("=================================");
});