import './App.css'
import { useEffect, useState } from 'react'
import useHederaWallet from './hooks/useHederaWallet'

function App() {
  const {
    initialize,
    isInitialized,
    isLocked,
    hasStoredCredentials,
    unlock,
    lock,
    pair,
    disconnect,
    eip155Wallet,
    hip820Wallet,
    network,
    ecdsaAccountId,
    ed25519AccountId,
    ed25519EvmAddress,
    ed25519EvmAddressSource,
    getSessions,
  } = useHederaWallet()
  const [ecdsaAccountIdInput, setEcdsaAccountIdInput] = useState('')
  const [ecdsaPrivateKeyInput, setEcdsaPrivateKeyInput] = useState('')
  const [ed25519AccountIdInput, setEd25519AccountIdInput] = useState('')
  const [ed25519PrivateKeyInput, setEd25519PrivateKeyInput] = useState('')
  const [projectId, setProjectId] = useState('')
  const [password, setPassword] = useState('')
  const [unlockPassword, setUnlockPassword] = useState('')
  const [uri, setUri] = useState('')
  const [isAutoInitializing, setIsAutoInitializing] = useState(false)
  const [unlockError, setUnlockError] = useState('')
  const [sessions, setSessions] = useState<any[]>([])

  // Check for stored credentials and auto-unlock attempt
  useEffect(() => {
    const storedProjectId = localStorage.getItem('projectId')
    if (storedProjectId) setProjectId(storedProjectId)

    // Check if we have a session password hash (wallet was unlocked in this session)
    const sessionPasswordHash = sessionStorage.getItem('walletPasswordHash')
    if (hasStoredCredentials && sessionPasswordHash && isLocked) {
      // Wallet was previously unlocked in this session, attempt auto-unlock
      setIsAutoInitializing(true)
      // Note: In a real app, you might want to store a temporary session token instead
      setIsAutoInitializing(false)
    }
  }, [hasStoredCredentials, isLocked])

  // Refresh sessions list periodically
  useEffect(() => {
    if (!isInitialized || isLocked) {
      setSessions([])
      return
    }

    const updateSessions = () => {
      const activeSessions = getSessions()
      setSessions(activeSessions)
    }

    // Update immediately
    updateSessions()

    // Update every 2 seconds
    const interval = setInterval(updateSessions, 2000)

    return () => clearInterval(interval)
  }, [isInitialized, isLocked, getSessions])

  const initHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Store project ID separately (not encrypted)
    localStorage.setItem('projectId', projectId)
    localStorage.setItem('network', 'testnet')

    // Initialize with password for encryption
    await initialize(
      ecdsaAccountIdInput,
      ecdsaPrivateKeyInput,
      ed25519AccountIdInput,
      ed25519PrivateKeyInput,
      'testnet',
      projectId,
      password,
    )

    // Clear sensitive form data
    setEcdsaAccountIdInput('')
    setEcdsaPrivateKeyInput('')
    setEd25519AccountIdInput('')
    setEd25519PrivateKeyInput('')
    setPassword('')
  }

  const handleUnlock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUnlockError('')

    const success = await unlock(unlockPassword)
    if (!success) {
      setUnlockError('Invalid password. Please try again.')
    } else {
      setUnlockPassword('')
    }
  }

  const handlePairing = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    pair(uri)
  }

  const handleClearData = () => {
    if (isInitialized) disconnect()
    localStorage.clear()
    sessionStorage.clear()
    setEcdsaAccountIdInput('')
    setEcdsaPrivateKeyInput('')
    setEd25519AccountIdInput('')
    setEd25519PrivateKeyInput('')
    setProjectId('')
    setPassword('')
    setUnlockPassword('')
    window.location.reload()
  }

  return (
    <div className="pages">
      <div className="logos">
        <img src="/reown.svg" alt="Reown" style={{ width: '150px', height: '150px' }} />
        <img src="/hedera.svg" alt="Hedera" style={{ width: '90px', height: '90px' }} />
      </div>

      <h1>Hedera Wallet Example</h1>
      {isAutoInitializing && (
        <section style={{ backgroundColor: '#f0f8ff', padding: '10px', borderRadius: '5px' }}>
          <p>Auto-initializing wallet with stored credentials...</p>
        </section>
      )}
      {isInitialized && !isLocked && (
        <section style={{ backgroundColor: '#d4edda', padding: '10px', borderRadius: '5px' }}>
          <p>✓ Wallet unlocked and ready to accept connections</p>
        </section>
      )}
      {isLocked && hasStoredCredentials && (
        <section style={{ backgroundColor: '#fff3cd', padding: '10px', borderRadius: '5px' }}>
          <p>🔒 Wallet is locked. Enter your password to unlock.</p>
        </section>
      )}
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

      {/* Show lock/unlock interface when wallet has stored credentials */}
      {hasStoredCredentials && isLocked ? (
        <section>
          <form onSubmit={handleUnlock}>
            <fieldset>
              <legend>🔒 Unlock Wallet</legend>
              <label>
                Password:
                <input
                  type="password"
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                  placeholder="Enter your wallet password"
                  required
                  autoFocus
                />
              </label>
              {unlockError && <p style={{ color: 'red', fontSize: '14px' }}>{unlockError}</p>}
            </fieldset>
            <button type="submit">Unlock</button>
          </form>
        </section>
      ) : isInitialized && !isLocked ? (
        // Show wallet info and pairing form when wallet is unlocked
        <>
          <section>
            <div
              style={{
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '5px',
                position: 'relative',
              }}
            >
              <button
                onClick={lock}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                🔓 Lock Wallet
              </button>
              <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#28a745' }}>
                ✓ Wallet Unlocked
              </h3>
              <div style={{ textAlign: 'left' }}>
                <div style={{ marginBottom: '15px' }}>
                  <strong>Network:</strong>{' '}
                  <span
                    style={{
                      padding: '2px 8px',
                      backgroundColor: network === 'testnet' ? '#ffc107' : '#28a745',
                      color: 'white',
                      borderRadius: '3px',
                      fontSize: '14px',
                    }}
                  >
                    {network.toUpperCase()}
                  </span>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <strong>ECDSA Account (EIP155 Wallet):</strong>
                  <div
                    style={{
                      marginTop: '5px',
                      padding: '10px',
                      backgroundColor: '#e3f2fd',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '14px',
                    }}
                  >
                    <div>
                      <span style={{ color: '#666' }}>Account ID:</span>{' '}
                      {ecdsaAccountId || 'N/A'}
                    </div>
                    <div>
                      <span style={{ color: '#666' }}>EVM Address:</span>{' '}
                      {eip155Wallet?.getEvmAddress() || 'N/A'}
                    </div>
                  </div>
                </div>
                <div>
                  <strong>Ed25519 Account (HIP820 Wallet):</strong>
                  <div
                    style={{
                      marginTop: '5px',
                      padding: '10px',
                      backgroundColor: '#e8f5e9',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '14px',
                    }}
                  >
                    <div>
                      <span style={{ color: '#666' }}>Account ID:</span>{' '}
                      {ed25519AccountId || 'N/A'}
                    </div>
                    <div>
                      <span style={{ color: '#666' }}>EVM Address:</span>{' '}
                      {ed25519EvmAddress || 'Loading...'}
                      {ed25519EvmAddressSource && (
                        <span
                          style={{
                            marginLeft: '8px',
                            fontSize: '12px',
                            padding: '2px 6px',
                            backgroundColor:
                              ed25519EvmAddressSource === 'mirror' ? '#4caf50' : '#ff9800',
                            color: 'white',
                            borderRadius: '3px',
                          }}
                        >
                          {ed25519EvmAddressSource === 'mirror'
                            ? 'From Mirror Node'
                            : 'Calculated (SDK)'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
              <button type="submit">Pair</button>
            </form>
          </section>
        </>
      ) : (
        // Show initialization form when no stored credentials
        <section>
          <form onSubmit={initHandler}>
            <fieldset>
              <legend>Step 1: Initialize WalletKit</legend>
              <div
                style={{
                  marginBottom: '15px',
                  padding: '10px',
                  backgroundColor: '#f0f8ff',
                  borderRadius: '5px',
                }}
              >
                <strong>ECDSA Account (Required for EIP155 namespace)</strong>
                <label>
                  Account ID:
                  <input
                    type="text"
                    autoComplete="username"
                    value={ecdsaAccountIdInput}
                    onChange={(e) => setEcdsaAccountIdInput(e.target.value)}
                    placeholder="0.0.12345"
                    required
                  />
                </label>
                <label>
                  ECDSA Hex Private Key:
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={ecdsaPrivateKeyInput}
                    onChange={(e) => setEcdsaPrivateKeyInput(e.target.value)}
                    placeholder="0x..."
                    required
                  />
                </label>
              </div>
              <div
                style={{
                  marginBottom: '15px',
                  padding: '10px',
                  backgroundColor: '#f0fff0',
                  borderRadius: '5px',
                }}
              >
                <strong>Ed25519 Account (Required for Hedera namespace)</strong>
                <label>
                  Account ID:
                  <input
                    type="text"
                    value={ed25519AccountIdInput}
                    onChange={(e) => setEd25519AccountIdInput(e.target.value)}
                    placeholder="0.0.67890"
                    required
                  />
                </label>
                <label>
                  Ed25519 Hex Private Key:
                  <input
                    type="password"
                    value={ed25519PrivateKeyInput}
                    onChange={(e) => setEd25519PrivateKeyInput(e.target.value)}
                    placeholder="302e..."
                    required
                  />
                </label>
              </div>
              <div
                style={{
                  marginBottom: '15px',
                  padding: '10px',
                  backgroundColor: '#fff5f5',
                  borderRadius: '5px',
                }}
              >
                <strong>Security Settings</strong>
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
                <label>
                  Wallet Password:
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    required
                  />
                </label>
                <small style={{ color: '#666' }}>
                  This password will be used to encrypt your private keys in local storage.
                </small>
              </div>
            </fieldset>
            <button
              type="submit"
              disabled={
                !ecdsaAccountIdInput ||
                !ecdsaPrivateKeyInput ||
                !ed25519AccountIdInput ||
                !ed25519PrivateKeyInput ||
                !projectId ||
                !password
              }
            >
              Initialize Wallet
            </button>
          </form>
        </section>
      )}

      <section
        style={{
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          marginTop: '20px',
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Active Sessions</h3>
        {sessions.length > 0 ? (
          <div
            style={{
              maxHeight: '200px',
              overflowY: 'auto',
              marginBottom: '15px',
              backgroundColor: 'white',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
            }}
          >
            {sessions.map((session, index) => (
              <div
                key={session.topic}
                style={{
                  padding: '10px',
                  borderBottom: index < sessions.length - 1 ? '1px solid #eee' : 'none',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  {session.peer?.metadata?.name || 'Unknown App'}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  <div>URL: {session.peer?.metadata?.url || 'N/A'}</div>
                  <div>Topic: {session.topic.substring(0, 20)}...</div>
                  <div>Namespaces: {Object.keys(session.namespaces).join(', ')}</div>
                  <div>Expiry: {new Date(session.expiry * 1000).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              color: '#999',
              backgroundColor: 'white',
              borderRadius: '5px',
              marginBottom: '15px',
            }}
          >
            No active sessions
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleClearData}>Clear All Data</button>
          {isInitialized && <button onClick={disconnect}>Disconnect Sessions</button>}
        </div>
      </section>
    </div>
  )
}

export default App
