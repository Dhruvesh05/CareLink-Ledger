import { create } from "ipfs-http-client";

const client = create({
  url: "http://127.0.0.1:5001/api/v0",
  timeout: 12000
});

try {
  const result = await client.version();

  console.log("IPFS VERSION:", result.version);
  console.log("IPFS CONNECTION: OK");
} catch (error) {
  console.error("IPFS CONNECTION FAILED:", error.message);
  process.exit(1);
}
