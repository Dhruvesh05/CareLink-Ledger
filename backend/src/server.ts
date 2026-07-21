import dotenv from "dotenv";
dotenv.config();

import app from "./app";

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log("=================================");
  console.log("CareLink Backend Started");
  console.log(`Server : http://localhost:${PORT}`);
  console.log(`Health : http://localhost:${PORT}/health`);
  console.log("=================================");
});