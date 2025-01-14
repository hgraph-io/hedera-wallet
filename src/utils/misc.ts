import { AccountId, Transaction } from "@hashgraph/sdk";
import { ethers } from "ethers";

/**
 * Converts hex to utf8 string if it is valid bytes
 */
export function convertHexToUtf8(value: string) {
  if (ethers.isHexString(value)) {
    return ethers.toUtf8String(value);
  }

  return value;
}

/**
 * Gets message from various signing request methods by filtering out
 * a value that is not an address (thus is a message).
 * If it is a hex string, it gets converted to utf8 string
 */
export function getSignParamsMessage(params: string[]) {
  const message = params.filter((p) => !ethers.isAddress(p))[0];

  return convertHexToUtf8(message);
}

/**
 * Gets data from various signTypedData request methods by filtering out
 * a value that is not an address (thus is data).
 * If data is a string convert it to object
 */
export function getSignTypedDataParamsData(params: string[]) {
  const data = params.filter((p) => !ethers.isAddress(p))[0];

  if (typeof data === "string") {
    return JSON.parse(data);
  }

  return data;
}

/**
 * @param transaction - a base64 encoded string of proto.TransactionBody.encode().finish()
 * @returns `string`
 * */
export function transactionToTransactionBody<T extends Transaction>(
  transaction: T,
  nodeAccountId?: AccountId,
) {
  // This is a private function, though provides the capabilities to construct a proto.TransactionBody
  // @ts-expect-error - call Transaction private method
  return transaction._makeTransactionBody(nodeAccountId)
}