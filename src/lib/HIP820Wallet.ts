import { Buffer } from "buffer";
import { getSdkError } from "@walletconnect/utils";
import {
  Wallet as HederaWallet,
  Client,
  AccountId,
  Transaction,
  Query,
} from "@hashgraph/sdk";

import {
  HederaChainId,
  HederaJsonRpcMethod,
  base64StringToQuery,
  Uint8ArrayToBase64String,
  stringToSignerMessage,
  signatureMapToBase64String,
  signerSignaturesToSignatureMap,
  base64StringToTransaction,
  getHederaError,
  GetNodeAddressesResult,
  ExecuteTransactionResult,
  SignAndExecuteQueryResult,
  SignMessageResult,
  SignAndExecuteTransactionResult,
  SignTransactionResult,
} from "@hashgraph/hedera-wallet-connect";
import { proto } from "@hashgraph/proto";
import Provider from "@hashgraph/hedera-wallet-connect/dist/lib/wallet/provider";

import { RequestEventArgs } from "../types/common";
import {
  formatJsonRpcError,
  formatJsonRpcResult,
  JsonRpcError,
  JsonRpcResult,
} from "@walletconnect/jsonrpc-utils";

interface IInitArgs {
  chainId: HederaChainId;
  accountId: AccountId | string;
  privateKey: string;
  _provider?: Provider;
}

export interface HIP820WalletInterface {
  approveSessionRequest(
    requestEvent: RequestEventArgs
  ): Promise<JsonRpcResult<any> | JsonRpcError>;
  rejectSessionRequest(requestEvent: RequestEventArgs): JsonRpcError;

  getHederaWallet(): HederaWallet;
  [HederaJsonRpcMethod.GetNodeAddresses](
    id: number,
    _: any
  ): Promise<GetNodeAddressesResult>;
  [HederaJsonRpcMethod.ExecuteTransaction](
    id: number,
    body: Transaction
  ): Promise<ExecuteTransactionResult>;
  [HederaJsonRpcMethod.SignMessage](
    id: number,
    body: string
  ): Promise<SignMessageResult>;
  [HederaJsonRpcMethod.SignAndExecuteQuery](
    id: number,
    body: Query<any>
  ): Promise<SignAndExecuteQueryResult>;
  [HederaJsonRpcMethod.SignAndExecuteTransaction](
    id: number,
    body: Transaction
  ): Promise<SignAndExecuteTransactionResult>;
  [HederaJsonRpcMethod.SignTransaction](
    id: number,
    body: Uint8Array
  ): Promise<SignTransactionResult>;
}

export class HIP820Wallet implements HIP820WalletInterface {
  wallet: HederaWallet;
  /*
   * Set default values for chains, methods, events
   */
  constructor(wallet: HederaWallet) {
    this.wallet = wallet;
  }

  /*
   * Hedera Wallet Signer
   */
  public getHederaWallet(): HederaWallet {
    return this.wallet;
  }

  static init({ chainId, accountId, privateKey, _provider }: IInitArgs) {
    const network = chainId.split(":")[1];
    const client = Client.forName(network);
    const provider = _provider ?? new Provider(client);
    const wallet = new HederaWallet(accountId, privateKey, provider);
    return new HIP820Wallet(wallet);
  }

  /*
   *  Session Requests
   */
  public validateParam(name: string, value: any, expectedType: string) {
    if (expectedType === "array" && Array.isArray(value)) return;
    if (typeof value === expectedType) return;

    throw getHederaError<string>(
      "INVALID_PARAMS",
      `Invalid paramameter value for ${name}, expected ${expectedType} but got ${typeof value}`
    );
  }

  public parseSessionRequest(
    event: RequestEventArgs,
    // optional arg to throw error if request is invalid, call with shouldThrow = false when calling from rejectSessionRequest as we only need id and top to send reject response
    shouldThrow = true
  ): {
    method: HederaJsonRpcMethod;
    chainId: HederaChainId;
    id: number; // session request id
    topic: string; // session topic
    body?: Transaction | Query<any> | string | Uint8Array | undefined;
    accountId?: AccountId;
  } {
    const { id, topic } = event;
    const {
      request: { method, params },
      chainId,
    } = event.params;

    let body: Transaction | Query<any> | string | Uint8Array | undefined;
    // get account id from optional second param for transactions and queries or from transaction id
    // this allows for the case where the requested signer is not the payer, but defaults to the payer if a second param is not provided
    let signerAccountId: AccountId | undefined;
    // First test for valid params for each method
    // then convert params to a body that the respective function expects
    try {
      switch (method) {
        case HederaJsonRpcMethod.GetNodeAddresses: {
          // 1
          if (params) throw getHederaError("INVALID_PARAMS");
          break;
        }
        case HederaJsonRpcMethod.ExecuteTransaction: {
          // 2
          const { transactionList } = params;
          this.validateParam("transactionList", transactionList, "string");
          body = base64StringToTransaction(transactionList);
          break;
        }
        case HederaJsonRpcMethod.SignMessage: {
          // 3
          const { signerAccountId: _accountId, message } = params;
          this.validateParam("signerAccountId", _accountId, "string");
          this.validateParam("message", message, "string");
          signerAccountId = AccountId.fromString(
            _accountId.replace(chainId + ":", "")
          );
          body = message;
          break;
        }
        case HederaJsonRpcMethod.SignAndExecuteQuery: {
          // 4
          const { signerAccountId: _accountId, query } = params;
          this.validateParam("signerAccountId", _accountId, "string");
          this.validateParam("query", query, "string");
          signerAccountId = AccountId.fromString(
            _accountId.replace(chainId + ":", "")
          );
          body = base64StringToQuery(query);
          break;
        }
        case HederaJsonRpcMethod.SignAndExecuteTransaction: {
          // 5
          const { signerAccountId: _accountId, transactionList } = params;
          this.validateParam("signerAccountId", _accountId, "string");
          this.validateParam("transactionList", transactionList, "string");

          signerAccountId = AccountId.fromString(
            _accountId.replace(chainId + ":", "")
          );
          body = base64StringToTransaction(transactionList);
          break;
        }
        case HederaJsonRpcMethod.SignTransaction: {
          // 6
          const { signerAccountId: _accountId, transactionBody } = params;
          this.validateParam("signerAccountId", _accountId, "string");
          this.validateParam("transactionBody", transactionBody, "string");
          signerAccountId = AccountId.fromString(
            _accountId.replace(chainId + ":", "")
          );
          body = Buffer.from(transactionBody, "base64");
          break;
        }
        default:
          throw getSdkError("INVALID_METHOD");
      }
      // error parsing request params
    } catch (e) {
      if (shouldThrow) throw e;
    }

    return {
      method: method as HederaJsonRpcMethod,
      chainId: chainId as HederaChainId,
      id,
      topic,
      body,
      accountId: signerAccountId,
    };
  }

  public async approveSessionRequest(
    event: RequestEventArgs
  ): Promise<JsonRpcResult<any>> {
    const { method, id, body } = this.parseSessionRequest(event);

    return this[method](id, body);
  }

  rejectSessionRequest(requestEvent: RequestEventArgs) {
    const { id } = requestEvent;

    return formatJsonRpcError(id, getSdkError("USER_REJECTED").message);
  }

  /*
   * JSON RPC Methods
   */
  // 1. hedera_getNodeAddresses
  public async hedera_getNodeAddresses(
    id: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: any // ignore this param to be consistent call signature with other functions
  ) {
    const nodesAccountIds = this.wallet.getNetwork();
    const nodes = Object.values(nodesAccountIds).map((nodeAccountId) =>
      nodeAccountId.toString()
    );
    return formatJsonRpcResult(id, {
      nodes,
    });
  }

  // 2. hedera_executeTransaction
  public async hedera_executeTransaction(id: number, body: Transaction) {
    return formatJsonRpcResult(id, (await this.wallet.call(body)).toJSON());
  }
  // 3. hedera_signMessage
  public async hedera_signMessage(id: number, body: string) {
    // signer takes an array of Uint8Arrays though spec allows for 1 message to be signed
    const signerSignatures = await this.wallet.sign(
      stringToSignerMessage(body)
    );

    const _signatureMap = proto.SignatureMap.create(
      signerSignaturesToSignatureMap(signerSignatures)
    );

    const signatureMap = signatureMapToBase64String(_signatureMap);

    return formatJsonRpcResult(id, {
      signatureMap,
    });
  }

  // 4. hedera_signAndExecuteQuery
  public async hedera_signAndExecuteQuery(id: number, body: Query<any>) {
    /*
     * Can be used with return values the have a toBytes method implemented
     * For example:
     * https://github.com/hashgraph/hedera-sdk-js/blob/c4438cbaa38074d8bfc934dba84e3b430344ed89/src/account/AccountInfo.js#L402
     */
    const queryResult = await body.executeWithSigner(this.wallet);
    let queryResponse = "";
    if (Array.isArray(queryResult)) {
      queryResponse = queryResult
        .map((qr) => Uint8ArrayToBase64String(qr.toBytes()))
        .join(",");
    } else {
      queryResponse = Uint8ArrayToBase64String(queryResult.toBytes());
    }

    return formatJsonRpcResult(id, {
      response: queryResponse,
    });
  }

  // 5. hedera_signAndExecuteTransaction
  public async hedera_signAndExecuteTransaction(id: number, body: Transaction) {
    const signedTransaction = await this.wallet.signTransaction(body);
    return formatJsonRpcResult(
      id,
      (await this.wallet.call(signedTransaction)).toJSON()
    );
  }

  // 6. hedera_signTransaction
  public async hedera_signTransaction(id: number, body: Uint8Array) {
    const signerSignatures = await this.wallet.sign([body]);

    const _signatureMap = proto.SignatureMap.create(
      signerSignaturesToSignatureMap(signerSignatures)
    );

    const signatureMap = signatureMapToBase64String(_signatureMap);

    return formatJsonRpcResult(id, {
      signatureMap,
    });
  }
}

export default HIP820Wallet;