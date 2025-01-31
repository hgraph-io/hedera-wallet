import {
  JsonRpcProvider,
  Wallet,
  BaseWallet as BaseEvmWallet,
  TransactionRequest,
  TransactionResponse,
  JsonRpcTransactionRequest,
  Transaction,
} from "ethers";

import {
  formatJsonRpcError,
  formatJsonRpcResult,
  JsonRpcError,
  JsonRpcResult,
} from "@walletconnect/jsonrpc-utils";
import { getSdkError } from "@walletconnect/utils";
import { EIP155_CHAINS, EIP155_METHODS, TEIP155Chain } from "../data/eip155";
import {
  getSignParamsMessage,
  getSignTypedDataParamsData,
} from "../utils/misc";
import { RequestEventArgs } from "../types/common";
/**
 * Types
 */
interface IInitArgs {
  privateKey?: string;
}

export interface EIP155WalletInterface {
  getPrivateKey(): string;
  getEvmAddress(): string;
  connect(provider: JsonRpcProvider): BaseEvmWallet;
  approveSessionRequest(
    requestEvent: RequestEventArgs,
  ): Promise<JsonRpcResult<any> | JsonRpcError>;
  rejectSessionRequest(requestEvent: RequestEventArgs): JsonRpcError;
  [EIP155_METHODS.PersonalSign](message: string): Promise<string>;
  [EIP155_METHODS.Sign](message: string): Promise<string>;
  [EIP155_METHODS.SignTypedData](
    domain: any,
    types: any,
    data: any,
  ): Promise<string>;
  [EIP155_METHODS.SignTypedDataV3](
    domain: any,
    types: any,
    data: any,
  ): Promise<string>;
  [EIP155_METHODS.SignTypedDataV4](
    domain: any,
    types: any,
    data: any,
  ): Promise<string>;
  [EIP155_METHODS.SignTransaction](
    transaction: JsonRpcTransactionRequest,
    provider: JsonRpcProvider,
  ): Promise<string>;
  [EIP155_METHODS.SendTransaction](
    transaction: JsonRpcTransactionRequest,
    provider: JsonRpcProvider,
  ): Promise<TransactionResponse>;
  [EIP155_METHODS.SendRawTransaction](
    rawTransaction: string,
    provider: JsonRpcProvider,
  ): Promise<TransactionResponse>;
}

/**
 * Library
 */
export default class EIP155Wallet implements EIP155WalletInterface {
  wallet: BaseEvmWallet;

  constructor(wallet: BaseEvmWallet) {
    this.wallet = wallet;
  }
  connect(provider: JsonRpcProvider): BaseEvmWallet {
    return this.wallet.connect(provider);
  }
  personal_sign(message: string): Promise<string> {
    return this.eth_sign(message);
  }
  eth_sign(message: string): Promise<string> {
    return this.wallet.signMessage(message);
  }
  eth_signTypedData(domain: any, types: any, data: any): Promise<string> {
    return this.wallet.signTypedData(domain, types, data);
  }
  eth_signTypedData_v3(domain: any, types: any, data: any): Promise<string> {
    return this.eth_signTypedData(domain, types, data);
  }
  eth_signTypedData_v4(domain: any, types: any, data: any): Promise<string> {
    return this.eth_signTypedData(domain, types, data);
  }
  async eth_signTransaction(transaction: JsonRpcTransactionRequest, provider: JsonRpcProvider): Promise<string> {
    console.log({ transaction });

    // Populate transaction
    const preparedTransaction = await this.connect(provider).populateTransaction(transaction as TransactionRequest);
    delete preparedTransaction.from;
    const txObj = Transaction.from(preparedTransaction);

    return this.wallet.signTransaction(txObj);
  }
  eth_sendTransaction(
    transaction: JsonRpcTransactionRequest,
    provider: JsonRpcProvider,
  ): Promise<TransactionResponse> {
    return this.connect(provider).sendTransaction(transaction as TransactionRequest);
  }
  eth_sendRawTransaction(
    rawTransaction: string,
    provider: JsonRpcProvider,
  ): Promise<TransactionResponse> {
    return provider.broadcastTransaction(rawTransaction);
  }

  static init({ privateKey }: IInitArgs) {
    const wallet = privateKey ? new Wallet(privateKey) : Wallet.createRandom();

    return new EIP155Wallet(wallet);
  }

  getPrivateKey() {
    return this.wallet.privateKey;
  }

  getEvmAddress() {
    return this.wallet.address;
  }

  async approveSessionRequest(requestEvent: RequestEventArgs) {
    const { params, id } = requestEvent;
    const { chainId, request } = params;

    switch (request.method) {
      case EIP155_METHODS.PersonalSign:
      case EIP155_METHODS.Sign:
        try {
          const message = getSignParamsMessage(request.params);
          const signedMessage = await this.eth_sign(message);
          return formatJsonRpcResult(id, signedMessage);
        } catch (error) {
          console.error(error);
          if (!(error instanceof Error)) {
            return formatJsonRpcError(id, "Failed to sign message");
          }
          alert(error.message);
          return formatJsonRpcError(id, error.message);
        }

      case EIP155_METHODS.SignTypedData:
      case EIP155_METHODS.SignTypedDataV3:
      case EIP155_METHODS.SignTypedDataV4:
        try {
          const {
            domain,
            types,
            message: data,
          } = getSignTypedDataParamsData(request.params);
          // https://github.com/ethers-io/ethers.js/issues/687#issuecomment-714069471
          delete types.EIP712Domain;
          const signedData = await this.eth_signTypedData(domain, types, data);
          return formatJsonRpcResult(id, signedData);
        } catch (error) {
          console.error(error);
          if (!(error instanceof Error)) {
            return formatJsonRpcError(id, "Failed to sign typed data");
          }
          alert(error.message);
          return formatJsonRpcError(id, error.message);
        }
      case EIP155_METHODS.SendRawTransaction:
      case EIP155_METHODS.SendTransaction:
        try {
          const provider = new JsonRpcProvider(
            EIP155_CHAINS[chainId as TEIP155Chain].rpc,
          );
          const sendTransaction = request.params[0];
          const txResponse = await this[request.method](
            sendTransaction,
            provider,
          );
          const txHash =
            typeof txResponse === "string" ? txResponse : txResponse?.hash;
          const txReceipt = await txResponse.wait();
          console.log(
            `Transaction broadcasted on chain ${chainId} , ${{
              txHash,
            }}, status: ${txReceipt?.status}`,
          );
          return formatJsonRpcResult(id, txHash);
        } catch (error) {
          console.error(error);
          return formatJsonRpcError(
            id,
            error instanceof Error
              ? error.message
              : "Failed to send transaction",
          );
        }

      case EIP155_METHODS.SignTransaction:
        try {
          const provider = new JsonRpcProvider(
            EIP155_CHAINS[chainId as TEIP155Chain].rpc,
          );
          const signTransaction = request.params[0];
          const signature = await this.eth_signTransaction(signTransaction, provider);
          return formatJsonRpcResult(id, signature);
        } catch (error) {
          console.error(error);
          if (!(error instanceof Error)) {
            return formatJsonRpcError(id, "Failed to sign transaction");
          }
          alert(error.message);
          return formatJsonRpcError(id, error.message);
        }
      default:
        throw new Error(getSdkError("INVALID_METHOD").message);
    }
  }

  rejectSessionRequest(requestEvent: RequestEventArgs) {
    const { id } = requestEvent;

    return formatJsonRpcError(id, getSdkError("USER_REJECTED").message);
  }
}
