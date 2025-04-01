import './App.css'
import { useEffect, useState } from 'react'
import useHederaWallet from './hooks/useHederaWallet'

function App() {
  const { initialize, isInitialized, pair, disconnect } = useHederaWallet()
  const [accountId, setAccountId] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [uri, setUri] = useState('')

  // get stored values from localStorage
  useEffect(() => {
    const storedAccountId = localStorage.getItem('accountId')
    const storedPrivateKey = localStorage.getItem('privateKey')
    if (!storedAccountId || !storedPrivateKey) return
    setPrivateKey(storedPrivateKey)
    setAccountId(storedAccountId)
  }, [])

  const initHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    localStorage.setItem('accountId', accountId)
    localStorage.setItem('privateKey', privateKey)
    initialize(accountId, privateKey, 'testnet')
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
            <label>
              Hedera Testnet Account Id:
              <input
                type="text"
                autoComplete="username"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
              />
            </label>
            <label>
              Hedera Testnet ECDSA Hex Private Key:
              <input
                type="password"
                autoComplete="current-password"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                required
              />
            </label>
          </fieldset>
          <button type="submit">{isInitialized ? 'Disconnect' : 'Initialize'}</button>
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
            setAccountId('')
            setPrivateKey('')
          }}
        >
          Clear Data
        </button>
      </section>
    </div>
  )
}

export default App
