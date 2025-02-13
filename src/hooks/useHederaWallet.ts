import { HederaWalletContext } from '../store/hedera-wallet-provider'
import { useContext } from 'react'

export default function useHederaWallet() {
  const context = useContext(HederaWalletContext)
  if (context === undefined) {
    throw new Error('useHederaWallet must be used within a HederaWalletProvider')
  }
  return context
}
