/**
 * @desc Reference list of Hedera eip155 chains
 * @url https://chainlist.org
 */

/**
 * Types
 */
export type TEIP155Chain = keyof typeof EIP155_CHAINS;

export type EIP155Chain = {
  chainId: number;
  rpc: string;
};

/**
 * Chains
 */
export const EIP155_MAINNET_CHAINS: Record<string, EIP155Chain> = {
  "eip155:295": {
    chainId: 295,
    rpc: "https://mainnet.hashio.io/api",
  },
};

export const EIP155_TEST_CHAINS: Record<string, EIP155Chain> = {
  "eip155:296": {
    chainId: 296,
    rpc: "https://testnet.hashio.io/api",
  },
};

export const EIP155_CHAINS = {
  ...EIP155_MAINNET_CHAINS,
  ...EIP155_TEST_CHAINS,
};

/**
 * Methods
 */
export enum EIP155_METHODS {
  PersonalSign = "personal_sign",
  Sign = "eth_sign",
  SignTransaction = "eth_signTransaction",
  SignTypedData = "eth_signTypedData",
  SignTypedDataV3 = "eth_signTypedData_v3",
  SignTypedDataV4 = "eth_signTypedData_v4",
  SendRawTransaction = "eth_sendRawTransaction",
  SendTransaction = "eth_sendTransaction",
}
