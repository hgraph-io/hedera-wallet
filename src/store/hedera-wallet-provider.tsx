import {
  PropsWithChildren,
  createContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react'
import {
  HederaChainId,
  HederaJsonRpcMethod,
  HIP820Wallet,
  EIP155Wallet,
  Eip155JsonRpcMethod,
  HederaChainDefinition,
} from '@hashgraph/hedera-wallet-connect'
import { PrivateKey } from '@hashgraph/sdk'
import { SignClientTypes } from '@walletconnect/types'
import WalletKit from '@reown/walletkit'
import { JsonRpcError, JsonRpcResult } from '@walletconnect/jsonrpc-utils'
import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils'
import { Core } from '@walletconnect/core'
import { CryptoUtils } from '../utils/crypto'
import Modal from '../components/Modal'
import PayloadDisplay from '../components/PayloadDisplay'
import { getEd25519EvmAddress } from '../utils/hedera'

interface HederaWalletContextType {
  isInitialized: boolean
  isLocked: boolean
  hasStoredCredentials: boolean
  initialize: (
    ecdsaAccountId: string,
    ecdsaPrivateKey: string,
    ed25519AccountId: string,
    ed25519PrivateKey: string,
    network: 'testnet' | 'mainnet',
    projectId: string,
    password?: string,
  ) => Promise<void>
  unlock: (password: string) => Promise<boolean>
  lock: () => void
  eip155Wallet?: EIP155Wallet
  hip820Wallet?: HIP820Wallet
  pair: (uri: string) => Promise<void>
  disconnect: () => Promise<void>
  network: 'testnet' | 'mainnet'
  ecdsaAccountId: string
  ed25519AccountId: string
  ed25519EvmAddress: string
  ed25519EvmAddressSource: 'mirror' | 'sdk' | null
  modal: {
    isOpen: boolean
    title: string
    content: any
    type: 'confirm' | 'error' | 'info'
    onConfirm?: () => void
    onReject?: () => void
  }
}

const initialState: HederaWalletContextType = {
  isInitialized: false,
  isLocked: true,
  hasStoredCredentials: false,
  initialize: async () => {},
  unlock: async () => false,
  lock: () => {},
  pair: async () => {},
  disconnect: async () => {},
  network: 'testnet',
  ecdsaAccountId: '',
  ed25519AccountId: '',
  ed25519EvmAddress: '',
  ed25519EvmAddressSource: null,
  modal: {
    isOpen: false,
    title: '',
    content: null,
    type: 'info',
  },
}

const HederaWalletContext = createContext<HederaWalletContextType>(initialState)

type HederaWalletProps = PropsWithChildren

export default function HederaWalletProvider({ children }: HederaWalletProps) {
  const [isInitialized, setInitialized] = useState(false)
  const [isLocked, setIsLocked] = useState(true)
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false)
  const [eip155Wallet, setEip155Wallet] = useState<EIP155Wallet>()
  const [hip820Wallet, setHip820Wallet] = useState<HIP820Wallet>()
  const walletkit = useRef<WalletKit>(undefined)
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet')
  const [ecdsaAccountId, setEcdsaAccountId] = useState<string>('')
  const [ed25519AccountId, setEd25519AccountId] = useState<string>('')
  const [ed25519EvmAddress, setEd25519EvmAddress] = useState<string>('')
  const [ed25519EvmAddressSource, setEd25519EvmAddressSource] = useState<
    'mirror' | 'sdk' | null
  >(null)
  const [modal, setModal] = useState<HederaWalletContextType['modal']>({
    isOpen: false,
    title: '',
    content: null,
    type: 'info',
  })

  const showModal = (
    title: string,
    content: any,
    type: 'confirm' | 'error' | 'info' = 'info',
    onConfirm?: () => void,
    onReject?: () => void,
  ) => {
    setModal({
      isOpen: true,
      title,
      content,
      type,
      onConfirm,
      onReject,
    })
  }

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }))
  }

  useEffect(() => {
    const hasEncryptedData = localStorage.getItem('encryptedWalletData')
    setHasStoredCredentials(!!hasEncryptedData)
  }, [])

  async function createWalletKit(projectId: string): Promise<WalletKit> {
    console.log('Creating WalletKit')
    const core = new Core({
      projectId,
      logger: 'error',
    })
    const walletkit = await WalletKit.init({
      core,
      metadata: {
        name: 'Hedera EIP155 & HIP820 Example',
        description: 'Hedera EIP155 & HIP820 Example',
        url: 'https://github.com/hashgraph/hedera-wallet-connect/',
        icons: ['https://avatars.githubusercontent.com/u/31002956'],
      },
    })

    return walletkit
  }

  const initialize = useCallback(
    async (
      ecdsaAccountId: string,
      ecdsaPrivateKey: string,
      ed25519AccountId: string,
      ed25519PrivateKey: string,
      network: 'testnet' | 'mainnet',
      projectId: string,
      password?: string,
    ) => {
      if (isInitialized || walletkit.current) {
        return
      }
      console.trace('initialize wallets')
      try {
        setNetwork(network)

        if (password) {
          const walletData = {
            ecdsaAccountId,
            ecdsaPrivateKey,
            ed25519AccountId,
            ed25519PrivateKey,
            network,
            projectId,
          }
          const encryptedData = await CryptoUtils.encrypt(JSON.stringify(walletData), password)
          localStorage.setItem('encryptedWalletData', encryptedData)
          const passwordHash = await CryptoUtils.hashPassword(password)
          sessionStorage.setItem('walletPasswordHash', passwordHash)
          setHasStoredCredentials(true)
        }

        // Validate that both key types are provided
        if (!ecdsaAccountId || !ecdsaPrivateKey || !ed25519AccountId || !ed25519PrivateKey) {
          throw new Error('Both ECDSA and Ed25519 accounts are required')
        }

        // Initialize EIP155 wallet with ECDSA key for EVM compatibility
        const eip155Wallet = EIP155Wallet.init({ privateKey: ecdsaPrivateKey })

        // Initialize HIP820 wallet - it can use either Ed25519 or ECDSA keys
        // For this demo, we'll use Ed25519 for native Hedera operations
        const hip820PrivateKey = PrivateKey.fromStringED25519(ed25519PrivateKey)
        console.log('Using Ed25519 account for HIP820 wallet:', ed25519AccountId)

        // Note: You could also initialize with ECDSA if preferred:
        // const hip820PrivateKey = PrivateKey.fromStringECDSA(ecdsaPrivateKey)
        // and use ecdsaAccountId instead

        const hip820Wallet = HIP820Wallet.init({
          chainId: `hedera:${network}` as HederaChainId,
          accountId: ed25519AccountId,
          privateKey: hip820PrivateKey as any,
        })

        setEip155Wallet(eip155Wallet)
        setHip820Wallet(hip820Wallet)
        setEcdsaAccountId(ecdsaAccountId)
        setEd25519AccountId(ed25519AccountId)

        // Fetch Ed25519 EVM address from mirror node or calculate via SDK
        const ed25519EvmResult = await getEd25519EvmAddress(ed25519AccountId, network)
        setEd25519EvmAddress(ed25519EvmResult.address)
        setEd25519EvmAddressSource(ed25519EvmResult.source)

        walletkit.current = await createWalletKit(projectId)

        setInitialized(true)
        setIsLocked(false)
      } catch (err: unknown) {
        console.error('Initialization failed', err)
        showModal(
          'Initialization Error',
          (err as Error).message || 'Failed to initialize wallet',
          'error',
        )
      }
    },
    [isInitialized],
  )

  const unlock = useCallback(
    async (password: string): Promise<boolean> => {
      try {
        const encryptedData = localStorage.getItem('encryptedWalletData')
        if (!encryptedData) {
          return false
        }

        const decryptedData = await CryptoUtils.decrypt(encryptedData, password)
        const walletData = JSON.parse(decryptedData)

        await initialize(
          walletData.ecdsaAccountId,
          walletData.ecdsaPrivateKey,
          walletData.ed25519AccountId,
          walletData.ed25519PrivateKey,
          walletData.network,
          walletData.projectId,
        )

        const passwordHash = await CryptoUtils.hashPassword(password)
        sessionStorage.setItem('walletPasswordHash', passwordHash)
        setIsLocked(false)
        return true
      } catch (error) {
        console.error('Failed to unlock wallet:', error)
        return false
      }
    },
    [initialize],
  )

  const lock = useCallback(() => {
    setEip155Wallet(undefined)
    setHip820Wallet(undefined)
    if (walletkit.current) {
      walletkit.current = undefined
    }
    setInitialized(false)
    setIsLocked(true)
    sessionStorage.removeItem('walletPasswordHash')
  }, [])

  useEffect(() => {
    if (!walletkit.current) return
    /******************************************************************************
     * 1. Open session proposal modal for confirmation / rejection
     *****************************************************************************/
    const onSessionProposal = async (
      proposal: SignClientTypes.EventArguments['session_proposal'],
    ) => {
      console.log('session_proposal', proposal)
      if (!walletkit.current) {
        throw new Error('WalletKit not initialized')
      }
      if (!eip155Wallet) {
        throw new Error('EIP155Wallet not initialized')
      }
      if (!hip820Wallet) {
        throw new Error('HIP820Wallet not initialized')
      }

      const processSessionProposal = async () => {
        try {
          const { Testnet, Mainnet } = HederaChainDefinition.EVM

          const eip155Network = network === 'testnet' ? Testnet : Mainnet
          const eip155Methods = Object.values(Eip155JsonRpcMethod)

          const hip820Chains =
            network === 'testnet' ? [HederaChainId.Testnet] : [HederaChainId.Mainnet]
          const hip820Methods = Object.values(HederaJsonRpcMethod)
          const events = ['accountsChanged', 'chainChanged']

          const params = {
            proposal: proposal.params,
            supportedNamespaces: {
              eip155: {
                chains: [eip155Network.caipNetworkId],
                methods: eip155Methods,
                events,
                accounts: [`${eip155Network.caipNetworkId}:${eip155Wallet.getEvmAddress()}`],
              },
              hedera: {
                chains: hip820Chains,
                methods: hip820Methods,
                events,
                accounts: hip820Chains.map(
                  (chain) =>
                    `${chain}:${hip820Wallet.getHederaWallet().getAccountId().toString()}`,
                ),
              },
            },
          }
          const approvedNamespaces = buildApprovedNamespaces(params)
          console.log({ params, approvedNamespaces })
          await walletkit.current.approveSession({
            id: proposal.id,
            namespaces: approvedNamespaces,
          })
        } catch (e) {
          showModal(
            'Session Error',
            (e as Error).message || 'Failed to process session',
            'error',
          )
        }
      }

      const handleApprove = async () => {
        closeModal()
        await processSessionProposal()
      }

      const handleReject = async () => {
        closeModal()
        await walletkit.current.rejectSession({
          id: proposal.id,
          reason: getSdkError('USER_REJECTED_METHODS'),
        })
      }

      showModal(
        'Session Connection Request',
        <div>
          <p style={{ marginBottom: '15px' }}>A dApp wants to connect to your wallet:</p>
          <PayloadDisplay payload={proposal} />
        </div>,
        'confirm',
        handleApprove,
        handleReject,
      )
    }

    /******************************************************************************
     * 3. Open request handling modal based on method that was used
     *****************************************************************************/
    const onSessionRequest = async (
      requestEvent: SignClientTypes.EventArguments['session_request'],
    ) => {
      try {
        const { topic, params } = requestEvent
        if (!walletkit.current) {
          throw new Error('WalletKit not initialized')
        }
        if (!eip155Wallet) {
          throw new Error('EIP155Wallet not initialized')
        }
        if (!hip820Wallet) {
          throw new Error('HIP820Wallet not initialized')
        }
        const method = params.request.method
        const isEIP155Method = Object.values(Eip155JsonRpcMethod).includes(
          method as Eip155JsonRpcMethod,
        )

        const processRequest = async (isConfirm: boolean) => {
          let response: JsonRpcResult<string> | JsonRpcError
          if (isConfirm) {
            response = isEIP155Method
              ? await eip155Wallet.approveSessionRequest(requestEvent)
              : await hip820Wallet.approveSessionRequest(requestEvent)
          } else {
            response = isEIP155Method
              ? eip155Wallet.rejectSessionRequest(requestEvent)
              : hip820Wallet.rejectSessionRequest(requestEvent)
          }

          await walletkit.current.respondSessionRequest({
            topic,
            response,
          })
        }

        const handleApproveRequest = async () => {
          closeModal()
          await processRequest(true)
        }

        const handleRejectRequest = async () => {
          closeModal()
          await processRequest(false)
        }

        showModal(
          'Transaction Request',
          <div>
            <p style={{ marginBottom: '15px' }}>Approve this transaction request?</p>
            <PayloadDisplay payload={requestEvent} />
          </div>,
          'confirm',
          handleApproveRequest,
          handleRejectRequest,
        )
      } catch (e) {
        showModal('Request Error', (e as Error).message || 'Failed to process request', 'error')
      }
    }
    console.log('Set up WalletConnect event listeners')
    walletkit.current.on('session_proposal', (...args) => onSessionProposal(...args))
    walletkit.current.on('session_request', (...args) => onSessionRequest(...args))

    walletkit.current.engine.signClient.events.on('session_ping', (data) =>
      console.log('ping', data),
    )
    walletkit.current.on('session_delete', (data) => {
      console.log('session_delete event received', data)
    })
    walletkit.current.core.pairing.events.on('pairing_delete', (pairing: string) => {
      // Session was deleted
      console.log(pairing)
      console.log(`Wallet: Pairing deleted by dapp!`)
      // clean up after the pairing for `topic` was deleted.
    })
  }, [eip155Wallet, hip820Wallet, network, isInitialized])

  async function disconnect() {
    console.log('Disconnecting from WalletConnect')
    if (!walletkit.current) {
      throw new Error('WalletKit not initialized')
    }

    //https://docs.walletconnect.com/web3wallet/wallet-usage#session-disconnect
    for (const session of Object.values(walletkit.current.getActiveSessions())) {
      console.log(`Disconnecting from session: ${session}`)
      await walletkit.current.disconnectSession({
        topic: session.topic,
        reason: getSdkError('USER_DISCONNECTED'),
      })
    }
    for (const pairing of walletkit.current.core.pairing.getPairings()) {
      console.log(`Disconnecting from pairing: ${pairing}`)
      await walletkit.current.disconnectSession({
        topic: pairing.topic,
        reason: getSdkError('USER_DISCONNECTED'),
      })
    }
    setInitialized(false)
    setIsLocked(true)
    walletkit.current = undefined
  }

  async function pair(uri: string) {
    if (!walletkit.current) {
      throw new Error('WalletKit not initialized')
    }
    await walletkit.current.core.pairing.pair({ uri })
  }

  const value = {
    isInitialized,
    isLocked,
    hasStoredCredentials,
    initialize,
    unlock,
    lock,
    eip155Wallet,
    hip820Wallet,
    disconnect,
    network,
    pair,
    ecdsaAccountId,
    ed25519AccountId,
    ed25519EvmAddress,
    ed25519EvmAddressSource,
    modal,
  }

  return (
    <HederaWalletContext.Provider value={value}>
      {children}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={modal.onConfirm}
        onReject={modal.onReject}
        title={modal.title}
        type={modal.type}
      >
        {modal.content}
      </Modal>
    </HederaWalletContext.Provider>
  )
}

export { HederaWalletContext }
