import "./App.css";
import { useEffect, useState } from "react";
import useHederaWallet from "./hooks/useHederaWallet";

function App() {
  const { initialize, isInitialized, pair, disconnect } = useHederaWallet();
  const [accountId, setAccountId] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [uri, setUri] = useState("");

  useEffect(() => {
    const storedAccountId = localStorage.getItem("accountId");
    const storedPrivateKey = localStorage.getItem("privateKey");
    if (!storedAccountId || !storedPrivateKey) return;
    initialize(storedAccountId, storedPrivateKey, "testnet");
  }, []);

  const initHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    localStorage.setItem("accountId", accountId);
    localStorage.setItem("privateKey", privateKey);
    initialize(accountId, privateKey, "testnet");
  };

  const handlePairing = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    pair(uri);
  };

  return (
    <div className="pages">
      <div className="logos">
        <img
          src="/reown.svg"
          alt="Reown"
          style={{ width: "150px", height: "150px" }}
        />
        <img
          src="/hedera.svg"
          alt="Hedera"
          style={{ width: "90px", height: "90px" }}
        />
      </div>

      <h1>WalletKit EIP-155 & HIP-820 Hedera Wallet Example</h1>
      <section>
        <p>
          This demo requires a Hedera testnet account and a project ID from
          WalletKit. Visit{" "}
          <a target="_blank" href="https://portal.hedera.com">
            Hedera Portal
          </a>{" "}
          or{" "}
          <a target="_blank" href="https://cloud.reown.com">
            Reown Cloud
          </a>{" "}
          for details.
        </p>
        <p>
          <b>Disclaimer:</b> Do not use your mainnet account or private key in
          this demo.
        </p>
      </section>
      <section>
        <form onSubmit={initHandler}>
          <fieldset>
            <legend>Step 1: Initialize Wallet</legend>
            <label>
              Hedera Testnet Account Id:
              <input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
              />
            </label>
            <label>
              Hedera Testnet Private Key:
              <input
                type="password"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                required
              />
            </label>
          </fieldset>
          <button type="submit" disabled={isInitialized}>
            {isInitialized ? "Initialized" : "Initialize WalletConnect"}
          </button>
        </form>
      </section>
      <section>
        <form onSubmit={handlePairing}>
          <fieldset>
            <legend>Step 3: Connect a dApp</legend>
            <label>
              dApp pairing string:
              <input
                type="text"
                value={uri}
                onChange={(e) => setUri(e.target.value)}
                required
              />
            </label>
          </fieldset>
          <button type="submit" disabled={!isInitialized}>
            Pair
          </button>
        </form>
      </section>
      <section>
        <button
          onClick={() => {
            disconnect();
            localStorage.clear();
            sessionStorage.clear();
          }}
          disabled={!isInitialized}
        >
          Disconnect & Clear Data
        </button>
      </section>
    </div>
  );
}

export default App;
