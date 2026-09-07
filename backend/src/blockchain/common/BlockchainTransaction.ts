export interface BlockchainTransaction {
    to: string;
    data: string;
    chainId: number;
    value?: string;
}
