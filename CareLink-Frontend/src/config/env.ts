const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) || "/api",
  ipfsGatewayUrl: (import.meta.env.VITE_IPFS_GATEWAY_URL as string | undefined) || "",
};

export { env };
