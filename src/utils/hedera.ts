import { AccountId } from '@hashgraph/sdk'

interface MirrorNodeAccountResponse {
  account: string
  alias: string | null
  evm_address: string | null
  balance: {
    balance: number
    timestamp: string
    tokens: any[]
  }
  created_timestamp: string
  ethereum_nonce: number
  expiry_timestamp: string | null
  auto_renew_period: number
  key: any
  max_automatic_token_associations: number
  memo: string
  pending_reward: number
  receiver_sig_required: boolean
  staked_account_id: string | null
  staked_node_id: number | null
  stake_period_start: string | null
  decline_reward: boolean
}

/**
 * Fetches the EVM address for an account from the mirror node
 * @param accountId - The Hedera account ID (e.g., "0.0.12345")
 * @param network - The network to query (testnet or mainnet)
 * @returns The EVM address if available, null otherwise
 */
export async function getEvmAddressFromMirror(
  accountId: string,
  network: 'testnet' | 'mainnet',
): Promise<{ address: string | null; source: 'mirror' | 'sdk' | null }> {
  try {
    const mirrorUrl =
      network === 'testnet'
        ? 'https://testnet.mirrornode.hedera.com'
        : 'https://mainnet-public.mirrornode.hedera.com'

    const response = await fetch(`${mirrorUrl}/api/v1/accounts/${accountId}`)

    if (!response.ok) {
      console.warn(`Mirror node request failed for account ${accountId}: ${response.status}`)
      return { address: null, source: null }
    }

    const data: MirrorNodeAccountResponse = await response.json()

    if (data.evm_address) {
      // Mirror node might return EVM address with or without 0x prefix
      const address = data.evm_address.startsWith('0x')
        ? data.evm_address
        : `0x${data.evm_address}`
      return {
        address,
        source: 'mirror',
      }
    }

    // No EVM address in mirror node
    return { address: null, source: null }
  } catch (error) {
    console.error('Error fetching from mirror node:', error)
    return { address: null, source: null }
  }
}

/**
 * Gets the Solidity address for an account using the SDK
 * This is a calculated address based on the account ID
 * @param accountId - The Hedera account ID string (e.g., "0.0.12345")
 * @returns The calculated Solidity address
 */
export function getSolidityAddressFromSdk(accountId: string): string {
  try {
    const account = AccountId.fromString(accountId)
    // toSolidityAddress already returns the address with 0x prefix
    const address = account.toSolidityAddress()
    // Ensure we don't have double 0x prefix
    return address.startsWith('0x') ? address : `0x${address}`
  } catch (error) {
    console.error('Error calculating Solidity address:', error)
    return 'Error calculating address'
  }
}

/**
 * Gets the EVM address for an Ed25519 account
 * First tries the mirror node, then falls back to SDK calculation
 * @param accountId - The Hedera account ID (e.g., "0.0.12345")
 * @param network - The network to query (testnet or mainnet)
 * @returns The EVM address and its source
 */
export async function getEd25519EvmAddress(
  accountId: string,
  network: 'testnet' | 'mainnet',
): Promise<{ address: string; source: 'mirror' | 'sdk' }> {
  // First try to get from mirror node
  const mirrorResult = await getEvmAddressFromMirror(accountId, network)

  if (mirrorResult.address && mirrorResult.source === 'mirror') {
    return {
      address: mirrorResult.address,
      source: 'mirror',
    }
  }

  // Fallback to SDK calculation
  const sdkAddress = getSolidityAddressFromSdk(accountId)
  return {
    address: sdkAddress,
    source: 'sdk',
  }
}
