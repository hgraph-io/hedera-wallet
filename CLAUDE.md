# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Run development server (port 5174)
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Format code with Prettier
npm run prettier

# Preview production build
npm run preview
```

## Architecture Overview

This is a demo wallet application that showcases Hedera integration using both native Hedera protocols (gRPC/REST) and Ethereum JSON-RPC compatibility. Built with React and TypeScript, it utilizes Reown WalletKit for WalletConnect protocol support.

### Key Components

- **`src/store/hedera-wallet-provider.tsx`**: Central wallet management using React Context pattern. Handles dual wallet initialization (EIP155 + HIP820), WalletConnect session lifecycle, and request routing between namespaces.

- **`src/hooks/useHederaWallet.ts`**: Custom hook providing type-safe access to wallet operations.

- **`src/App.tsx`**: Main UI component with wallet initialization and pairing interface.

### Dual Protocol Architecture

The wallet supports two distinct integration approaches:

1. **Native Hedera (HIP820Wallet)**:
   - Direct gRPC/REST API calls to Hedera network
   - Supports both Ed25519 and ECDSA accounts
   - Uses `hedera` namespace in WalletConnect
   - Full access to native Hedera transaction types

2. **EVM Compatibility (EIP155Wallet)**:
   - Ethereum JSON-RPC methods via Hedera JSON-RPC Relay
   - ECDSA accounts only (Ed25519 not supported)
   - Uses `eip155` namespace in WalletConnect
   - Compatible with standard Ethereum tooling

### WalletConnect Integration

- **Dual Namespace Support**: Simultaneously handles both `eip155` and `hedera` namespaces in a single session
- **Event-Driven Architecture**: Listens to `session_proposal` and `session_request` events
- **Request Routing**: Automatically routes requests to appropriate wallet based on namespace
- **User Confirmation**: Browser confirm dialogs for session and transaction approval

## Environment Configuration

Required environment variable:
- `VITE_REOWN_PROJECT_ID`: Reown project ID from cloud.reown.com

Setup:
```bash
cp .env.example .env
# Edit .env with your project ID
```

## Integration with hedera-wallet-connect Library

This wallet demo serves as a reference implementation for the `@hashgraph/hedera-wallet-connect` library, demonstrating:

- Proper initialization of `EIP155Wallet` and `HIP820Wallet` from the library
- WalletConnect session management patterns
- Dual namespace handling in practice
- Error handling and user interaction flows

The wallet is designed to work with the hedera-app demo for complete dApp-to-wallet communication testing.

## Important Considerations

1. **Account Compatibility**: Users must provide ECDSA private keys for dual namespace support (Ed25519 only works with native Hedera namespace)

2. **Network Configuration**: Supports both testnet and mainnet, with network preference stored in localStorage

3. **Security Note**: This is a demo wallet - credentials are stored in browser localStorage and should never be used with mainnet accounts containing real value

4. **Development Port**: Runs on port 5174 to avoid conflicts with hedera-app demo (port 5173)