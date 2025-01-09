import { SignClientTypes } from "@walletconnect/types";

export type RequestEventArgs = Omit<
  SignClientTypes.EventArguments["session_request"],
  "verifyContext"
>;
