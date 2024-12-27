import { WalletKit, IWalletKit } from "@reown/walletkit";
import { Core } from "@walletconnect/core";

export async function createWalletKit(): Promise<IWalletKit> {

  const core = new Core({
    projectId: import.meta.env.VITE_REOWN_PROJECT_ID,
    logger: "trace",
  });
  const walletkit = await WalletKit.init({
    core,
    metadata: {
      name: "Hedera EIP155 & HIP820 Example",
      description: "Hedera EIP155 & HIP820 Example",
      url: "https://github.com/hashgraph/hedera-wallet-connect/",
      icons: ["https://avatars.githubusercontent.com/u/31002956"],
    },
  });

  try {
    const clientId =
      await walletkit.engine.signClient.core.crypto.getClientId();
    console.log("WalletConnect ClientID: ", clientId);
    return walletkit;
  } catch (error) {
    throw new Error(
      "Failed to set WalletConnect clientId in localStorage: " +
        (error instanceof Error ? error.message : error)
    );
  }
}
