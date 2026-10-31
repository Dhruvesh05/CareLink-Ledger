import { getNetworkOption } from "./network";

export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
  on?: (eventName: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (eventName: string, listener: (...args: unknown[]) => void) => void;
};

export function getEthereumProvider(): Eip1193Provider | null {
  const provider = (window as Window & { ethereum?: Eip1193Provider }).ethereum;
  return provider ?? null;
}

export async function connectWallet(): Promise<string> {
  const provider = getEthereumProvider();
  if (!provider) {
    throw new Error("MetaMask is not installed or available");
  }

  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts?.length) {
    throw new Error("No wallet account was selected");
  }

  return accounts[0];
}

export async function getWalletChainId(): Promise<number> {
  const provider = getEthereumProvider();
  if (!provider) {
    throw new Error("MetaMask is not installed or available");
  }

  const result = (await provider.request({ method: "eth_chainId" })) as string;
  return Number.parseInt(result, 16);
}

function getProviderErrorCode(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }
  const code = (error as { code?: unknown }).code;
  return typeof code === "number" ? code : undefined;
}

/** Switches MetaMask to a supported CareLink testnet, adding it if needed. */
export async function ensureWalletNetwork(chainId: number): Promise<void> {
  const provider = getEthereumProvider();
  if (!provider) {
    throw new Error("MetaMask is not installed or available");
  }

  const network = getNetworkOption(chainId);
  if (!network) {
    throw new Error(`Unsupported CareLink network: ${chainId}`);
  }

  if (await getWalletChainId() === chainId) {
    return;
  }

  const hexChainId = `0x${chainId.toString(16)}`;
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hexChainId }],
    });
  } catch (error) {
    if (getProviderErrorCode(error) !== 4902) {
      throw error;
    }

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: hexChainId,
        chainName: network.name,
        nativeCurrency: network.nativeCurrency,
        rpcUrls: [network.rpcUrl],
        blockExplorerUrls: [network.explorerUrl],
      }],
    });

    // Some wallets add without switching, so explicitly verify/switch again.
    if (await getWalletChainId() !== chainId) {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }],
      });
    }
  }

  const actualChainId = await getWalletChainId();
  if (actualChainId !== chainId) {
    throw new Error(`MetaMask is still on chain ${actualChainId}. Switch it to ${network.name} before continuing.`);
  }
}

/** Backwards-compatible helper for older call sites. */
export async function ensurePolygonAmoy(): Promise<void> {
  return ensureWalletNetwork(80002);
}

export async function sendMetaMaskTransaction(params: {
  from: string;
  to: string;
  data: string;
  value?: string;
  chainId?: number;
}): Promise<string> {
  const provider = getEthereumProvider();
  if (!provider) {
    throw new Error("MetaMask is not installed or available");
  }

  if (params.chainId !== undefined) {
    const actualChainId = await getWalletChainId();
    if (actualChainId !== params.chainId) {
      const network = getNetworkOption(params.chainId);
      throw new Error(`Network mismatch: this transaction requires ${network?.name ?? `chain ${params.chainId}`}, but MetaMask is on chain ${actualChainId}. Switch networks and retry.`);
    }
  }

  // Polygon Amoy RPC currently requires a priority fee of at least 25 Gwei.
  // Apply a 30 Gwei tip only to Amoy; leave Sepolia's fee estimation untouched.
  const polygonAmoyFeeOverrides = params.chainId === 80002
    ? {
        maxPriorityFeePerGas: `0x${BigInt("30000000000").toString(16)}`,
        maxFeePerGas: `0x${BigInt("60000000000").toString(16)}`,
      }
    : {};

  const result = (await provider.request({
    method: "eth_sendTransaction",
    params: [{
      from: params.from,
      to: params.to,
      data: params.data,
      value: params.value ?? "0x0",
      chainId: params.chainId
        ? `0x${params.chainId.toString(16)}`
        : undefined,
      ...polygonAmoyFeeOverrides,
    }],
  })) as string;

  if (!result) {
    throw new Error("MetaMask did not return a transaction hash");
  }

  for (let i = 0; i < 60; i++) {
    const receipt = await provider.request({
      method: "eth_getTransactionReceipt",
      params: [result],
    });

    if (receipt) {
      return result;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("Transaction was submitted but was not mined within 2 minutes");
}

export async function signMessage(message: string, walletAddress: string): Promise<string> {
  const provider = getEthereumProvider();
  if (!provider) {
    throw new Error("MetaMask is not installed or available");
  }

  const result = (await provider.request({
    method: "personal_sign",
    params: [message, walletAddress],
  })) as string;

  if (!result) {
    throw new Error("Signing was rejected by the wallet");
  }

  return result;
}
