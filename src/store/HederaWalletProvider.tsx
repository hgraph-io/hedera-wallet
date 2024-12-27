import {
  PropsWithChildren,
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  HederaChainId,
  HederaJsonRpcMethod,
} from "@hashgraph/hedera-wallet-connect";
import { SignClientTypes } from "@walletconnect/types";
import { IWalletKit } from "@reown/walletkit";
import { JsonRpcError, JsonRpcResult } from "@walletconnect/jsonrpc-utils";
import { buildApprovedNamespaces, getSdkError } from "@walletconnect/utils";
import {
  EIP155_MAINNET_CHAINS,
  EIP155_METHODS,
  EIP155_TEST_CHAINS,
} from "../data/EIP155Data";
import { createWalletKit } from "../utils/WalletConnectUtil";
import EIP155Wallet from "../lib/EIP155Wallet";
import HIP820Wallet from "../lib/HIP820Wallet";

interface HederaWalletContextType {
  isInitialized: boolean;
  initialize: (
    accountId: string,
    privateKey: string,
    network: "testnet" | "mainnet"
  ) => Promise<void>;
  eip155Wallet?: EIP155Wallet;
  hip820Wallet?: HIP820Wallet;
  pair: (uri: string) => Promise<void>;
  disconnect: () => Promise<void>;
  network: "testnet" | "mainnet";
}

const initialState: HederaWalletContextType = {
  isInitialized: false,
  initialize: async () => {},
  pair: async () => {},
  disconnect: async () => {},
  network: "testnet",
};

const HederaWalletContext =
  createContext<HederaWalletContextType>(initialState);

type HederaWalletProps = PropsWithChildren;

export default function HederaWalletProvider({ children }: HederaWalletProps) {
  const [isInitialized, setInitialized] = useState(false);
  const [eip155Wallet, setEip155Wallet] = useState<EIP155Wallet>();
  const [hip820Wallet, setHip820Wallet] = useState<HIP820Wallet>();
  const walletkit = useRef<IWalletKit>();
  const [network, setNetwork] = useState<"testnet" | "mainnet">("testnet");

  const initialize = useCallback(
    async (
      accountId: string,
      privateKey: string,
      network: "testnet" | "mainnet"
    ) => {
      if (isInitialized) {
        return;
      }
      try {
        setNetwork(network);
        const eip155Wallet = EIP155Wallet.init({ privateKey });
        const hip820Wallet = HIP820Wallet.init({
          chainId: `hedera:${network}` as HederaChainId,
          accountId,
          privateKey,
        });
        setEip155Wallet(eip155Wallet);
        setHip820Wallet(hip820Wallet);

        console.log(eip155Wallet.getEvmAddress());
        if (!walletkit.current) {
          walletkit.current = await createWalletKit();
        }

        setInitialized(true);
      } catch (err: unknown) {
        console.error("Initialization failed", err);
        alert(err);
      }
    },
    [isInitialized]
  );

  /******************************************************************************
   * 1. Open session proposal modal for confirmation / rejection
   *****************************************************************************/
  const onSessionProposal = useCallback(
    async (proposal: SignClientTypes.EventArguments["session_proposal"]) => {
      console.log("session_proposal", proposal);
      if (!walletkit.current) {
        throw new Error("WalletKit not initialized");
      }
      if (!eip155Wallet) {
        throw new Error("EIP155Wallet not initialized");
      }
      if (!hip820Wallet) {
        throw new Error("HIP820Wallet not initialized");
      }
      if (
        !confirm(
          `Do you want to connect to this session?:\n${JSON.stringify(
            proposal
          )}`
        )
      ) {
        await walletkit.current.rejectSession({
          id: proposal.id,
          reason: getSdkError("USER_REJECTED_METHODS"),
        });
      }
      try {
        const eip155Chains = Object.keys(
          network === "testnet" ? EIP155_TEST_CHAINS : EIP155_MAINNET_CHAINS
        );
        const eip155Methods = Object.values(EIP155_METHODS);

        const hip820Chains =
          network === "testnet"
            ? [HederaChainId.Testnet]
            : [HederaChainId.Mainnet];
        const hip820Methods = Object.values(HederaJsonRpcMethod);
        const events = ["accountsChanged", "chainChanged"];

        const params = {
          proposal: proposal.params,
          supportedNamespaces: {
            eip155: {
              chains: eip155Chains,
              methods: eip155Methods,
              events,
              accounts: eip155Chains.map(
                (chain) => `${chain}:${eip155Wallet.getEvmAddress()}`
              ),
            },
            hedera: {
              chains: hip820Chains,
              methods: hip820Methods,
              events,
              accounts: hip820Chains.map(
                (chain) =>
                  `${chain}:${hip820Wallet
                    .getHederaWallet()
                    .getAccountId()
                    .toString()}`
              ),
            },
          },
        };
        console.log({ params });
        await walletkit.current.approveSession({
          id: proposal.id,
          namespaces: buildApprovedNamespaces(params),
        });
      } catch (e) {
        alert((e as Error).message);
      }
    },
    [eip155Wallet, hip820Wallet, network]
  );

  /******************************************************************************
   * 3. Open request handling modal based on method that was used
   *****************************************************************************/
  const onSessionRequest = useCallback(
    async (requestEvent: SignClientTypes.EventArguments["session_request"]) => {
      try {
        const { topic, params } = requestEvent;
        if (!walletkit.current) {
          throw new Error("WalletKit not initialized");
        }
        if (!eip155Wallet) {
          throw new Error("EIP155Wallet not initialized");
        }
        if (!hip820Wallet) {
          throw new Error("HIP820Wallet not initialized");
        }
        const method = params.request.method;
        const isEIP155Method = Object.values(EIP155_METHODS).includes(
          method as EIP155_METHODS
        );

        const isConfirm = window.confirm(
          `Do you want to proceed with this request?:\n${JSON.stringify(
            requestEvent
          )}`
        );

        let response: JsonRpcResult<string> | JsonRpcError;
        if (isConfirm) {
          response = isEIP155Method
            ? await eip155Wallet.approveSessionRequest(requestEvent)
            : await hip820Wallet.approveSessionRequest(requestEvent);
        } else {
          response = isEIP155Method
            ? eip155Wallet.rejectSessionRequest(requestEvent)
            : hip820Wallet.rejectSessionRequest(requestEvent);
        }

        await walletkit.current.respondSessionRequest({
          topic,
          response,
        });
      } catch (e) {
        alert((e as Error).message);
      }
    },

    [eip155Wallet, hip820Wallet]
  );

  /******************************************************************************
   * Set up WalletConnect event listeners
   *****************************************************************************/
  useEffect(() => {
    if (isInitialized && walletkit.current) {
      //sign
      walletkit.current.on("session_proposal", onSessionProposal);
      walletkit.current.on("session_request", onSessionRequest);

      walletkit.current.engine.signClient.events.on("session_ping", (data) =>
        console.log("ping", data)
      );
      walletkit.current.on("session_delete", (data) => {
        console.log("session_delete event received", data);
      });
      walletkit.current.core.pairing.events.on(
        "pairing_delete",
        (pairing: string) => {
          // Session was deleted
          console.log(pairing);
          console.log(`Wallet: Pairing deleted by dapp!`);
          // clean up after the pairing for `topic` was deleted.
        }
      );
    }
  }, [isInitialized, onSessionProposal, onSessionRequest]);

  async function disconnect() {
    if (!walletkit.current) {
      throw new Error("WalletKit not initialized");
    }
    //https://docs.walletconnect.com/web3wallet/wallet-usage#session-disconnect
    for (const session of Object.values(
      walletkit.current.getActiveSessions()
    )) {
      console.log(`Disconnecting from session: ${session}`);
      await walletkit.current.disconnectSession({
        topic: session.topic,
        reason: getSdkError("USER_DISCONNECTED"),
      });
    }
    for (const pairing of walletkit.current.core.pairing.getPairings()) {
      console.log(`Disconnecting from pairing: ${pairing}`);
      await walletkit.current.disconnectSession({
        topic: pairing.topic,
        reason: getSdkError("USER_DISCONNECTED"),
      });
    }
    setInitialized(false);
  }

  async function pair(uri: string) {
    if (!walletkit.current) {
      throw new Error("WalletKit not initialized");
    }
    await walletkit.current.core.pairing.pair({ uri });
  }

  const value = {
    isInitialized,
    initialize,
    eip155Wallet,
    hip820Wallet,
    disconnect,
    network,
    pair,
  };

  return (
    <HederaWalletContext.Provider value={value}>
      {children}
    </HederaWalletContext.Provider>
  );
}

export { HederaWalletContext };
