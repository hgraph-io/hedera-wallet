import { useState } from 'react'

interface Account {
  id: string
  address: string
  type: 'ECDSA' | 'Ed25519'
  namespace: 'eip155' | 'hedera'
}

interface AccountSelectionModalProps {
  accounts: Account[]
  onSelectAccount: (account: Account) => void
  onCancel: () => void
  dappName?: string
  dappUrl?: string
}

export default function AccountSelectionModal({
  accounts,
  onSelectAccount,
  onCancel,
  dappName,
  dappUrl,
}: AccountSelectionModalProps) {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)

  const handleConfirm = () => {
    if (selectedAccount) {
      onSelectAccount(selectedAccount)
    }
  }

  // Group accounts by namespace
  const eip155Accounts = accounts.filter((acc) => acc.namespace === 'eip155')
  const hederaAccounts = accounts.filter((acc) => acc.namespace === 'hedera')

  const renderAccountGroup = (
    groupAccounts: Account[],
    namespaceLabel: string,
    description: string,
  ) => {
    if (groupAccounts.length === 0) return null

    return (
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#333',
            marginBottom: '8px',
            padding: '8px 12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            borderLeft: '3px solid #007bff',
          }}
        >
          {namespaceLabel}
          <div style={{ fontSize: '12px', fontWeight: 400, color: '#666', marginTop: '4px' }}>
            {description}
          </div>
        </div>
        {groupAccounts.map((account, index) => (
          <label
            key={`${account.namespace}-${index}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              marginBottom: '8px',
              marginLeft: '12px',
              border: '1px solid',
              borderColor: selectedAccount === account ? '#007bff' : '#e0e0e0',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: selectedAccount === account ? '#f0f8ff' : 'white',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (selectedAccount !== account) {
                e.currentTarget.style.backgroundColor = '#f8f9fa'
              }
            }}
            onMouseLeave={(e) => {
              if (selectedAccount !== account) {
                e.currentTarget.style.backgroundColor = 'white'
              }
            }}
          >
            <input
              type="radio"
              name="account"
              value={`${account.namespace}-${index}`}
              checked={selectedAccount === account}
              onChange={() => setSelectedAccount(account)}
              style={{
                marginRight: '12px',
                width: '18px',
                height: '18px',
                cursor: 'pointer',
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, marginBottom: '4px' }}>{account.id}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {account.address && (
                  <div>
                    Address: {account.address.slice(0, 6)}...{account.address.slice(-4)}
                  </div>
                )}
                <div>Type: {account.type}</div>
                {account.type === 'ECDSA' && account.namespace === 'eip155' && (
                  <div style={{ color: '#28a745', fontWeight: 500 }}>
                    ✓ Includes Hedera namespace
                  </div>
                )}
                {account.type === 'ECDSA' && account.namespace === 'hedera' && (
                  <div style={{ color: '#28a745', fontWeight: 500 }}>
                    ✓ Includes EIP155 namespace
                  </div>
                )}
              </div>
            </div>
          </label>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        {dappName && (
          <div style={{ marginBottom: '15px' }}>
            <strong>DApp:</strong> {dappName}
            {dappUrl && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{dappUrl}</div>
            )}
          </div>
        )}
        <p style={{ marginBottom: '15px' }}>
          Select which account you want to connect to this dApp:
        </p>
      </div>

      <div
        style={{
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '15px',
          maxHeight: '400px',
          overflowY: 'auto',
        }}
      >
        {renderAccountGroup(
          eip155Accounts,
          'EIP155 Namespace',
          'EVM-compatible accounts (ECDSA accounts will also enable Hedera namespace)',
        )}
        {renderAccountGroup(
          hederaAccounts,
          'Hedera Namespace',
          'Native Hedera accounts (ECDSA accounts will also enable EIP155 namespace)',
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end',
          marginTop: '20px',
        }}
      >
        <button
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: '1px solid #dc3545',
            backgroundColor: 'white',
            color: '#dc3545',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#dc3545'
            e.currentTarget.style.color = 'white'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white'
            e.currentTarget.style.color = '#dc3545'
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selectedAccount}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: selectedAccount ? '#28a745' : '#cccccc',
            color: 'white',
            cursor: selectedAccount ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'background-color 0.2s',
            opacity: selectedAccount ? 1 : 0.6,
          }}
          onMouseEnter={(e) => {
            if (selectedAccount) {
              e.currentTarget.style.backgroundColor = '#218838'
            }
          }}
          onMouseLeave={(e) => {
            if (selectedAccount) {
              e.currentTarget.style.backgroundColor = '#28a745'
            }
          }}
        >
          Connect
        </button>
      </div>
    </div>
  )
}
