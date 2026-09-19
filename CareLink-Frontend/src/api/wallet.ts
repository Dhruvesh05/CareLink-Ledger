export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
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

export async function ensurePolygonAmoy(): Promise<void> {
  const provider = getEthereumProvider();
  if (!provider) {
    throw new Error("MetaMask is not installed or available");
  }

  const chainId = await getWalletChainId();
  if (chainId === 80002) {
    return;
  }

  await provider.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: "0x13882" }],
  });
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

  const result = (await provider.request({
    method: "eth_sendTransaction",
    params: [{
      from: params.from,
      to: params.to,
      data: params.data,
      value: params.value ?? "0x0",
      maxPriorityFeePerGas: "0x5d21dba00",
      maxFeePerGas: "0x174876e800",
      chainId: params.chainId
        ? `0x${params.chainId.toString(16)}`
        : undefined,
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
