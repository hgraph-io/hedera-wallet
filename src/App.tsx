import useHederaWallet from "./hooks/useHederaWallet";

function App() {
  const { initialize, isInitialized, pair, disconnect } =
    useHederaWallet();

    console.log("WalletKit ClientID: ", import.meta.env.VITE_REOWN_PROJECT_ID);
  const initHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const accountId = formData.get("account-id") as string;
    const privateKey = formData.get("private-key") as string;
    
    await initialize(accountId, privateKey, "testnet");
  };
  return (
    <main>
      <h1>EIP-155 & HIP-820 Wallet</h1>
      <div>
        <p>
          This demo requires a Hedera testnet account as well as a project id
          from WalletKit.
        </p>
        <p>
          Please see
          <a target="_blank" href="https://portal.hedera.com">
            {" "}
            https://portal.hedera.com{" "}
          </a>
          and{" "}
          <a target="_blank" href="https://cloud.reown.com">
          https://cloud.reown.com
          </a>
        </p>
        <p>
          <b>Disclaimer:</b> This demo is for demonstration purposes only. It is
          not intended to be used in production. Do not use your mainnet account
          or private key!
        </p>
        <section>
          <form id="init" onSubmit={initHandler}>
            <fieldset>
              <legend>Step 1: Initialize WalletKit and set ECDSA hedera account</legend>
              <p>
                <i>
                  For brevity, this demo only supports a single account, though
                  WalletKit supports multiple accounts.
                </i>
              </p>
              <label>
                Hedera Testnet Account Id:
                <input type="text" name="account-id" required />
              </label>
              <label>
                Hedera Testnet Hex Encoded Private Key:
                <input type="password" name="private-key" required />
              </label>
            </fieldset>
            <button type="submit">Initialize WalletConnect</button>
          </form>
        </section>
        <section>
          <form
            className="toggle"
            onSubmit={(e) => {
              e.preventDefault();
              const uri = (e.target as HTMLFormElement).uri.value;
              pair(uri);
            }}
          >
            <fieldset>
              <legend>Step 3: Connect a dApp</legend>
              <p>
                <i>
                  WalletKit saves pairing and session information in
                  localStorage. If you've previously paired with a dApp and the
                  session has not expired, you do not need to pair again.
                </i>
              </p>
              <label>
                dApp pairing string
                <input type="text" name="uri" required />
              </label>
            </fieldset>
            <button type="submit" disabled={!isInitialized}>Pair</button>
          </form>
        </section>
        <hr />
        <h2>Pairing and session management:</h2>
        <section>
          <form
            className="toggle"
            onSubmit={async (e) => {
              e.preventDefault();
              await disconnect();
            }}
          >
            <button type="submit" disabled={!isInitialized}>Disconnect all sessions and pairings</button>
            <button
              type="button"
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                location.reload();
              }}
            >
              Clear saved data
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default App;
