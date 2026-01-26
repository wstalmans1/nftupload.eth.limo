# NFTupload DApp Scaffold & Architecture

This document describes the repository scaffolding and architecture so the same setup can be reproduced in a new project.

## 1) Overview

- **Monorepo** with pnpm workspaces
- **Contracts**: Hardhat + OpenZeppelin Upgradeable (UUPS)
- **Frontend**: Next.js App Router, client‑only, static export
- **Wallet**: Wagmi + Viem + RainbowKit
- **Metadata**: Client pins JSON metadata to IPFS via Pinata (image CID provided by user)

## 2) Repository Layout

```
.
├── apps/
│   └── web/                 # Next.js frontend (client-only)
├── packages/
│   └── contracts/           # Hardhat contracts + scripts + tests
├── DEPLOYMENTS.md           # Recorded deployments (proxy + implementation)
├── SCAFFOLDING.md           # This document
├── package.json             # Root scripts + pnpm workspace config
└── pnpm-workspace.yaml      # Workspace declaration
```

## 3) Root Workspace Setup

**package.json** (root)
- Defines workspace scripts to run dev, build, deploy.
- Uses pnpm workspaces.

**pnpm-workspace.yaml**
- Includes `apps/*` and `packages/*`.

**.gitignore**
- Ignores `node_modules`, `.env`, `.next`, `out`, Hardhat artifacts, etc.

## 4) Contracts Package

Location: `packages/contracts`

### Key files
- `hardhat.config.ts`
  - Hardhat Toolbox
  - OpenZeppelin upgrades plugin
  - Sepolia network from env
  - Sourcify verification enabled
- `contracts/NFTUpload.sol`
  - UUPS upgradeable ERC721
  - Open mint (`mint(string tokenURI)`)
  - Stores token URI per token (ERC721URIStorageUpgradeable)
  - Emits `Minted` event
  - `nextTokenId()` view helper for UI
- `scripts/deploy.ts`
  - Deploys UUPS proxy
  - Logs proxy + implementation addresses
- `test/NFTUpload.test.ts`
  - Basic mint and tokenURI check
- `.env.example`
  - `SEPOLIA_RPC_URL`
  - `DEPLOYER_PRIVATE_KEY`

### Contract summary
- **Proxy** address is used by the frontend.
- **Implementation** address is only for verification/upgrades.
- UUPS upgrade authorization is `onlyOwner`.

## 5) Frontend Package

Location: `apps/web`

### Key files
- `app/layout.tsx`
  - Loads Google fonts
  - Applies global CSS
  - **Dynamically imports Providers with `ssr: false`** to avoid SSR issues with wallet libs.
- `app/providers.tsx`
  - Wagmi config + RainbowKit provider
  - Sepolia chain
  - Uses `NEXT_PUBLIC_SEPOLIA_RPC_URL` or fallback public RPC
- `app/page.tsx`
  - UI flow: image CID → optional name → optional metadata CID → mint
  - If no metadata CID, uploads JSON to Pinata and uses resulting IPFS URI
  - Calls `mint(tokenURI)` on the proxy contract
  - Shows tx hash, token URI, token ID
- `lib/contract.ts`
  - Contract ABI + address env binding
- `app/globals.css`
  - Custom styling

### Client‑only + static export
- `next.config.js` sets `output: "export"` for static export.
- No API routes, no server actions.
- All wallet logic runs on the client.

## 6) Environment Variables

**Contracts (`packages/contracts/.env`)**
```
SEPOLIA_RPC_URL=
DEPLOYER_PRIVATE_KEY=
```

**Frontend (`apps/web/.env.local`)**
```
NEXT_PUBLIC_SEPOLIA_RPC_URL=
NEXT_PUBLIC_WC_PROJECT_ID=
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_PINATA_JWT=
```

Notes:
- `NEXT_PUBLIC_*` values are public and embedded in the client bundle.
- `NEXT_PUBLIC_CONTRACT_ADDRESS` must be the **proxy** address.

## 7) Deployment Flow

### Contracts
1) Install deps: `pnpm install`
2) Fill `packages/contracts/.env`
3) Deploy: `pnpm -C packages/contracts deploy:sepolia`
4) Record addresses in `DEPLOYMENTS.md`

### Frontend
1) Fill `apps/web/.env.local`
2) Run dev: `pnpm -C apps/web dev`
3) Build static export: `pnpm -C apps/web build`
4) Deploy static output from `apps/web/out`

## 8) Notes on Wallet & SSR

- RainbowKit/Wagmi/WalletConnect access browser-only APIs (like `indexedDB`).
- To avoid SSR crashes, `Providers` is loaded via `next/dynamic` with `ssr: false`.

## 9) Reproducing From Scratch (Checklist)

- Create monorepo layout (`apps/web`, `packages/contracts`).
- Add root `package.json` + `pnpm-workspace.yaml`.
- Scaffold Hardhat + OpenZeppelin upgradeable contract + deploy script.
- Scaffold Next.js app (App Router) with Wagmi/Viem/RainbowKit.
- Add environment variable examples.
- Enable static export.
- Deploy and wire the proxy address into frontend.

