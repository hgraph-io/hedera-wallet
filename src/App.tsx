import './App.css'
import { useEffect, useState } from 'react'
import useHederaWallet from './hooks/useHederaWallet'

function App() {
  const { initialize, isInitialized, pair, disconnect } = useHederaWallet()
  const [ecdsaAccountId, setEcdsaAccountId] = useState('')
  const [ecdsaPrivateKey, setEcdsaPrivateKey] = useState('')
  const [ed25519AccountId, setEd25519AccountId] = useState('')
  const [ed25519PrivateKey, setEd25519PrivateKey] = useState('')
  const [projectId, setProjectId] = useState('')
  const [uri, setUri] = useState('')

  // get stored values from localStorage
  useEffect(() => {
    const storedEcdsaAccountId = localStorage.getItem('ecdsaAccountId')
    const storedEcdsaPrivateKey = localStorage.getItem('ecdsaPrivateKey')
    const storedEd25519AccountId = localStorage.getItem('ed25519AccountId')
    const storedEd25519PrivateKey = localStorage.getItem('ed25519PrivateKey')
    const storedProjectId = localStorage.getItem('projectId')
    if (storedEcdsaAccountId) setEcdsaAccountId(storedEcdsaAccountId)
    if (storedEcdsaPrivateKey) setEcdsaPrivateKey(storedEcdsaPrivateKey)
    if (storedEd25519AccountId) setEd25519AccountId(storedEd25519AccountId)
    if (storedEd25519PrivateKey) setEd25519PrivateKey(storedEd25519PrivateKey)
    if (storedProjectId) setProjectId(storedProjectId)
  }, [])

  const initHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Store all values
    localStorage.setItem('ecdsaAccountId', ecdsaAccountId)
    localStorage.setItem('ecdsaPrivateKey', ecdsaPrivateKey)
    localStorage.setItem('ed25519AccountId', ed25519AccountId)
    localStorage.setItem('ed25519PrivateKey', ed25519PrivateKey)
    localStorage.setItem('projectId', projectId)
    
    // Initialize with both accounts
    initialize(
      ecdsaAccountId,
      ecdsaPrivateKey,
      ed25519AccountId,
      ed25519PrivateKey,
      'testnet',
      projectId
    )
  }

  const handlePairing = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    pair(uri)
  }

  return (
    <div className="pages">
      <div className="logos">
        <img src="/reown.svg" alt="Reown" style={{ width: '150px', height: '150px' }} />
        <img src="/hedera.svg" alt="Hedera" style={{ width: '90px', height: '90px' }} />
      </div>

      <h1>Hedera Wallet Example</h1>
      <section>
        <p>
          This example demonstrates integrating both Hedera Native Transactions and EVM JSON-RPC
          transactions utilizing the Hedera JSON-RPC relay.
        </p>
        <p>
          To get started, you'll need a{' '}
          <a target="_blank" href="https://portal.hedera.com">
            Hedera testnet account{' '}
          </a>{' '}
          and a project ID from{' '}
          <a target="_blank" href="https://cloud.reown.com">
            Reown
          </a>
          .
        </p>
        <p>
          <b>Disclaimer:</b> Do not use your mainnet account or private key in this demo.
        </p>
      </section>
      <section>
        <form onSubmit={isInitialized ? disconnect : initHandler}>
          <fieldset>
            <legend>Step 1: Initialize WalletKit</legend>
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '5px' }}>
              <strong>ECDSA Account (Required for EIP155 namespace)</strong>
              <label>
                Account ID:
                <input
                  type="text"
                  autoComplete="username"
                  value={ecdsaAccountId}
                  onChange={(e) => setEcdsaAccountId(e.target.value)}
                  placeholder="0.0.12345"
                  required
                />
              </label>
              <label>
                ECDSA Hex Private Key:
                <input
                  type="password"
                  autoComplete="current-password"
                  value={ecdsaPrivateKey}
                  onChange={(e) => setEcdsaPrivateKey(e.target.value)}
                  placeholder="0x..."
                  required
                />
              </label>
            </div>
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f0fff0', borderRadius: '5px' }}>
              <strong>Ed25519 Account (Optional - Hedera namespace only)</strong>
              <label>
                Account ID:
                <input
                  type="text"
                  value={ed25519AccountId}
                  onChange={(e) => setEd25519AccountId(e.target.value)}
                  placeholder="0.0.67890 (optional)"
                />
              </label>
              <label>
                Ed25519 Hex Private Key:
                <input
                  type="password"
                  value={ed25519PrivateKey}
                  onChange={(e) => setEd25519PrivateKey(e.target.value)}
                  placeholder="302e... (optional)"
                />
              </label>
            </div>
            <label>
              Reown Project ID:
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="Get from cloud.reown.com"
                required
              />
            </label>
          </fieldset>
          <button type="submit" disabled={!isInitialized && (!ecdsaAccountId || !ecdsaPrivateKey || !projectId)}>
            {isInitialized ? 'Disconnect' : 'Initialize'}
          </button>
        </form>
      </section>
      <section>
        <form onSubmit={handlePairing}>
          <fieldset>
            <legend>Step 2: Connect an app</legend>
            <label>
              App pairing string:
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
            if (isInitialized) disconnect()
            localStorage.clear()
            sessionStorage.clear()
            setEcdsaAccountId('')
            setEcdsaPrivateKey('')
            setEd25519AccountId('')
            setEd25519PrivateKey('')
            setProjectId('')
          }}
        >
          Clear Data
        </button>
      </section>
    </div>
  )
}

export default App
