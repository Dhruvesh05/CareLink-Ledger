export type CareLinkNetworkOption = {
  chainId: number;
  name: string;
  networkName: string;
  explorerUrl: string;
  rpcUrl: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
};

export const CARELINK_CHAIN_STORAGE_KEY = "carelink-blockchain-chain-id";
export const CARELINK_NETWORK_CHANGED_EVENT = "carelink:network-changed";

export const CARELINK_NETWORKS: CareLinkNetworkOption[] = [
  {
    chainId: 11155111,
    name: "Ethereum Sepolia",
    networkName: "Sepolia",
    explorerUrl: "https://sepolia.etherscan.io",
    rpcUrl: "https://rpc.sepolia.dev",
    nativeCurrency: { name: "Sepolia Ether", symbol: "SepoliaETH", decimals: 18 },
  },
  {
    chainId: 80002,
    name: "Polygon Amoy",
    networkName: "Amoy",
    explorerUrl: "https://amoy.polygonscan.com",
    // Polygon-operated rpc-amoy.polygon.technology was scheduled for
    // deprecation in July 2026; use the currently listed PublicNode endpoint.
    rpcUrl: "https://polygon-amoy-bor-rpc.publicnode.com",
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  },
];

export function getNetworkOption(chainId: number): CareLinkNetworkOption | undefined {
  return CARELINK_NETWORKS.find((network) => network.chainId === chainId);
}

export function getSelectedChainId(): number {
  const saved = window.localStorage.getItem(CARELINK_CHAIN_STORAGE_KEY);
  const chainId = saved ? Number(saved) : 80002;
  return getNetworkOption(chainId)?.chainId ?? 80002;
}

export function setSelectedChainId(chainId: number): CareLinkNetworkOption {
  const network = getNetworkOption(chainId);
  if (!network) {
    throw new Error(`Unsupported CareLink network: ${chainId}`);
  }
  window.localStorage.setItem(CARELINK_CHAIN_STORAGE_KEY, String(chainId));
  window.dispatchEvent(new CustomEvent(CARELINK_NETWORK_CHANGED_EVENT, { detail: { chainId } }));
  return network;
}
