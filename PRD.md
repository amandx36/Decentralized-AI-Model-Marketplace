# PRD - Decentralized AI Model Marketplace

## 1. Product Overview
This product is a decentralized marketplace for AI/ML models. Developers can upload trained models, prove ownership on blockchain, sell access to buyers, and let users run inference on those models without a central platform controlling the data or access.

The project uses:
- React frontend
- Java Spring Boot backend
- MongoDB for metadata and user records
- Ethereum smart contracts for ownership and access rights
- IPFS for model file storage
- Python ML service for model inference
- MetaMask wallet auth + JWT for user security

Goal:
- let creators monetize AI models
- let buyers access AI models in a trustless way
- remove middlemen from ownership and payments
- keep model files and ownership verifiable

---

## 2. Core Problem
AI models are valuable but hard to monetize in a fair and transparent way. Centralized platforms control uploads, pricing, and access. There is also no easy way to prove who owns a model and who has paid for access.

This product solves that by combining:
- wallet-based identity
- blockchain ownership records
- decentralized file storage
- marketplace logic for access sales
- inference flow checks for access validation

---

## 3. Target Users

### 3.1 Model Creator
- uploads trained model
- sets price and metadata
- receives payments
- tracks usage and sales

### 3.2 Buyer / Consumer
- browses model catalog
- checks details and pricing
- pays for access
- runs inference on owned models

### 3.3 Platform Admin
- monitors users and transactions
- checks platform fee collection
- manages system health
- moderates content or access if needed

---

## 4. Product Goals
- allow model creators to list models for sale
- ensure model ownership is provable on-chain
- enable buyers to purchase access using crypto
- verify access before model execution
- keep metadata and user activity in a controllable backend database
- make the app feel like a normal marketplace but with Web3 trust

---

## 5. Product Non-Goals
- full centralized identity system
- fiat payment integration in MVP
- huge enterprise admin suite
- complex governance token system
- full model training platform
- multi-chain support in initial release

---

## 6. User Stories

### Creator
- As a creator, I want to upload my model so I can sell access.
- As a creator, I want my ownership recorded on blockchain so buyers trust it.
- As a creator, I want to set a price so I can earn from my work.
- As a creator, I want to view my sales and earnings.

### Buyer
- As a buyer, I want to browse models so I can find useful AI tools.
- As a buyer, I want to buy access with crypto so I can use the model legally.
- As a buyer, I want to run inference only after access is verified.
- As a buyer, I want to see my purchase history.

### Admin
- As an admin, I want to see transactions so I can monitor platform activity.
- As an admin, I want to check model status so I can review listings.
- As an admin, I want to enforce policies and platform rules.

---

## 7. Functional Requirements

### 7.1 Authentication
- user connects wallet using MetaMask
- user requests nonce from backend
- wallet signs nonce
- backend verifies signature
- backend returns JWT and refresh token
- protected APIs require valid JWT

### 7.2 Model Upload
- creator uploads model file
- metadata fields include:
  - name
  - description
  - category
  - price
  - tags
  - file type
  - license / usage policy
- backend uploads file to IPFS
- backend stores file CID and metadata in MongoDB
- blockchain contract stores ownership + pricing metadata

### 7.3 Model Catalog
- public page shows all available models
- allows search, filter, and sorting
- each card shows owner, price, file type, category, status

### 7.4 Model Detail
- shows description, price, metadata, owner, and access state
- if user owns model, inference button is enabled
- if not owned, purchase option is shown

### 7.5 Purchase Flow
- user selects model
- contract call triggers payment
- buyer pays ETH to marketplace contract
- smart contract records access rights
- backend saves transaction log
- buyer is granted access

### 7.6 Inference Flow
- buyer sends modelId + inputData with valid JWT
- backend validates buyer access against blockchain
- backend loads model metadata
- backend fetches model from IPFS or storage
- backend calls Python ML service
- results are returned to buyer

### 7.7 User Dashboard
- show uploaded models
- show purchased models
- show earnings and transaction history
- show wallet address and profile info

### 7.8 Admin Panel
- monitor activity
- handle approvals or moderation
- view wallet activity and platform metrics

---

## 8. Non-Functional Requirements
- secure wallet authentication
- JWT expiry and refresh handling
- proper CORS and security config
- low-latency inference response
- robust error handling for failed uploads and transactions
- support for connected apps and wallets
- production-ready config for secrets via env variables

---

## 9. Proposed Pages

### Public pages
1. Landing Page
2. Explore Models
3. Model Detail
4. Login / Wallet Connect
5. About / How it works
6. FAQ
7. Terms / Policy

### Authenticated pages
8. Upload New Model
9. Dashboard
10. My Models
11. My Purchases
12. Settings
13. Inference Runner
14. Checkout / Purchase Confirmation

### Admin pages
15. Admin Dashboard
16. Transactions
17. Model Moderation
18. User Management

---

## 10. Page-by-Page Details

### 10.1 Landing Page
- hero section with branding
- short product explanation
- CTA: Connect Wallet / Explore Models
- featured models
- stats: models listed, creators, transactions

### 10.2 Explore Models Page
- search bar
- filters by type, price, category, tags
- sorting by newest / cheapest / popular
- card grid of models

### 10.3 Model Detail Page
- title, description, category, price
- owner info
- tags
- file type
- terms and usage conditions
- purchase button or run model button

### 10.4 Upload Page
- model name
- file upload field
- description
- category
- price
- tags
- submit button
- loading + transaction status

### 10.5 Purchase Page
- selected model summary
- wallet connected status
- total amount in ETH
- confirm purchase button
- transaction result

### 10.6 Inference Page
- input fields based on model format
- run button
- result panel
- error panel
- execution timing info

### 10.7 Dashboard
- total uploads count
- total earnings
- purchased models list
- recent transactions
- profile summary

### 10.8 Settings
- username
- bio
- notification settings
- wallet pairing info

### 10.9 Admin Dashboard
- user counts
- sales metrics
- recent contract events
- moderation queue

---

## 11. Data Flow by Layer

### Frontend
- wallet connection
- login request
- model browsing
- purchase call
- inference call
- dashboard rendering

### Backend
- JWT validation
- auth logic
- model metadata CRUD
- IPFS upload coordination
- transaction log persistence
- access validation

### Blockchain
- model ownership registration
- purchase access
- payment settlement
- access enforcement
- on-chain verification

### IPFS
- store model files
- return file hash / CID
- support retrieval for inference and display

### MongoDB
- users
- models
- transactions
- purchases
- activity logs



## 12. API Wireframe (Main ones)

### Auth APIs
- POST /api/auth/request-nonce
- POST /api/auth/verify
- POST /api/auth/refresh
- GET /api/test/public
- GET /api/test/private
- GET /api/test/health

### Model APIs
- GET /api/models
- GET /api/models/{id}
- POST /api/models
- PUT /api/models/{id}
- DELETE /api/models/{id}

### Purchase APIs
- POST /api/purchase
- GET /api/purchases/{walletAddress}

### Inference APIs
- POST /api/infer
- GET /api/infer/history

---

## 13. Security Rules
- only connect wallet addresses allowed
- one nonce per wallet login request
- message must equal signed nonce
- recovered wallet address must match provided address
- JWT must be sent on protected API calls
- blockchain access must be checked before inference runs
- private keys never exposed to browser

---

## 14. Risks / Constraints
- blockchain transactions can fail due to gas/network issues
- IPFS files may become unavailable if not pinned correctly
- model inference may be slow for large models
- wallet auth depends on user browser wallet setup
- backend must handle failed signature verification safely
- contract deployment addresses must be managed correctly

---

## 15. MVP Success Criteria
- user can connect wallet
- user can request nonce and login
- user can upload model metadata/file
- model appears on marketplace list
- buyer can purchase access
- buyer can run inference on owned model
- dashboard shows correct user activity
- backend and blockchain remain secure and traceable

---

## 16. Final Product Summary
This project is a decentralized AI marketplace where creators sell access to models, buyers pay using crypto, ownership is provable on blockchain, and model execution is governed by access rights. It combines trustless ownership, decentralized storage, wallet auth, and AI inference into one marketplace experience.

This is the product vision of the app as it is being built.
