# Blockchain (Hardhat)

This directory contains the Solidity contracts, unit tests, and deployment scripts for the on-chain portion of the Decentralized AI Model Marketplace.

## What’s inside

- `contracts/` — Solidity smart contracts (ModelRegistry, Marketplace, AccessControl)
- `test/` — Mocha/Chai tests that run against Hardhat’s local EVM
- `scripts/deploy.js` — A simple deployment script for Hardhat
- `hardhat.config.js` — Solidity compiler settings and optimizer

## Quick Start

```bash
cd blockchain
npm install
npx hardhat test
```

Run the deploy script (local Hardhat node):

```bash
npx hardhat run scripts/deploy.js
```

> Note: This setup currently runs against Hardhat’s local network. To deploy to a public testnet (e.g. Sepolia), add a network configuration to `hardhat.config.js` and provide an RPC URL + private key via environment variables.
