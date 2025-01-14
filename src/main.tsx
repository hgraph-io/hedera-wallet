import { createRoot } from "react-dom/client";
import App from "./App";
import HederaWalletProvider from "./store/hedera-wallet-provider";

createRoot(document.getElementById("root")!).render(
  <HederaWalletProvider>
    <App />
  </HederaWalletProvider>,
);
