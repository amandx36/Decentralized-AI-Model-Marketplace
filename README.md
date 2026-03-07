# UNDER CONSTRUCTION

# 🧠 Decentralized AI Model Marketplace

> Upload, own, and sell your AI/ML models on a blockchain-powered marketplace. Ownership is stored on Ethereum, files on IPFS, and payments happen through smart contracts — no middleman.

---

## 🚀 What This Project Does

- Developers upload their trained ML models (.pkl, .onnx, .pt, .h5)
- Ownership is registered on Ethereum blockchain (can't be faked)
- Files are stored on IPFS (decentralized, tamper-proof)
- Buyers pay ETH through a smart contract to get access
- Buyers can then run inference on the model directly from the platform

---

## 🏗️ Tech Stack

| Layer          | Technology                                         |
| -------------- | -------------------------------------------------- |
| **Frontend**   | React.js, TailwindCSS, ethers.js, Vite             |
| **Backend**    | Java 17, Spring Boot 3, Maven                      |
| **Blockchain** | Solidity, Hardhat, Web3j, Ethereum Sepolia Testnet |
| **Storage**    | IPFS via Pinata                                    |
| **Auth**       | MetaMask Wallet + JWT                              |
| **Database**   | MongoDB                                            |
| **ML Service** | Python FastAPI                                     |

---

## 📁 Project Structure & Every File Explained

```
decentralized-ai-marketplace/
│
├── README.md
├── .gitignore
├── docker-compose.yml
│
├── blockchain/
├── backend/
├── frontend/
└── ml-service/
```

---

### 🔗 `blockchain/` — Smart Contracts

This folder contains the Solidity contracts that manage model ownership, access rights, and payments. It is a standard Hardhat project with unit tests and a simple deploy script.

```
blockchain/
├── contracts/
│   ├── ModelRegistry.sol       # Stores model metadata (name, IPFS hash, price, owner)
│   ├── Marketplace.sol         # Handles payments, access grants, and fee splitting
│   └── AccessControl.sol       # Simple role-based access control (OWNER/VIEWER/EDITOR/ADMIN)
│
├── scripts/
│   └── deploy.js               # Deploys the Marketplace (and inherited contracts) to a network
│
├── test/
│   ├── ModelRegistry.test.js   # Unit tests: register model, transfer ownership
│   └── Marketplace.test.js     # Unit tests: purchase flow, no double purchases
│
├── artifacts/                  # Build artifacts (Hardhat output)
├── cache/                      # Hardhat cache
├── hardhat.config.js           # Hardhat configuration (Solidity version + optimizer)
├── package.json                # Hardhat dependencies (ethers, chai, mocha, etc.)
└── package-lock.json           # Lockfile
```

**What each contract does:**

`ModelRegistry.sol`

- Register a model with a name, IPFS hash, price, and owner address.
- Stores: modelId, name, ipfsHash, price, owner, active flag.
- Owner can transfer model ownership.

`Marketplace.sol`

- Buyers call `purchaseAccess(modelId)` and send ETH.
- Contract splits payment: 95% to model owner, 5% to platform.
- Records that the buyer has access via `buyerAccess[modelId][buyer]`.
- `hasAccess(modelId, userAddress)` returns whether the buyer has purchased access.

`AccessControl.sol`

- The deployer becomes the contract owner.
- Owner can assign roles (NONE, VIEWER, EDITOR, ADMIN) to addresses.
- Backend can check a user’s role via `checkAccess()`.

### 🧪 Running the blockchain tests and deploy script

```bash
cd blockchain
npm install
npx hardhat test
```

To deploy locally (Hardhat network):

```bash
npx hardhat run scripts/deploy.js
```

> Note: This repo does not currently configure any public testnet (Sepolia) endpoints. To deploy to a live network, add a network section to `hardhat.config.js` and provide a private key + RPC URL via environment variables.

---

### ☕ `backend/` — Java Spring Boot API

```
backend/
├── pom.xml                         # Maven file — add all Java dependencies here
└── src/
    └── main/
        ├── java/com/aimarketplace/
        │   │
        │   ├── AiMarketplaceApplication.java     # Main file — run this to start the server
        │   │
        │   ├── config/
        │   │   ├── MongoConfig.java              # Connects to MongoDB using URI from .properties
        │   │   ├── Web3jConfig.java              # Sets up Web3j so we can talk to Ethereum
        │   │   ├── PinataConfig.java             # Pinata API key config for IPFS uploads
        │   │   └── SecurityConfig.java           # Sets up JWT auth, CORS, and which routes are public
        │   │
        │   ├── controller/
        │   │   ├── AuthController.java           # POST /api/auth/verify — login with wallet signature
        │   │   ├── ModelController.java          # GET /api/models, POST /api/models — list & upload models
        │   │   ├── PurchaseController.java       # POST /api/purchase/record — save purchase to DB
        │   │   └── InferenceController.java      # POST /api/infer — run a model (checks access first)
        │   │
        │   ├── service/
        │   │   ├── JwtService.java               # Creates JWT token after wallet login, validates it on requests
        │   │   ├── IpfsService.java              # Uploads file to Pinata, returns IPFS CID
        │   │   ├── BlockchainService.java        # Calls smart contract functions using Web3j
        │   │   ├── ModelService.java             # Main logic: upload to IPFS, register on-chain, save to DB
        │   │   └── InferenceService.java         # Checks access on-chain, then calls Python ML service
        │   │
        │   ├── repository/
        │   │   ├── ModelRepository.java          # MongoDB queries for AI model documents
        │   │   ├── UserRepository.java           # MongoDB queries for user profiles
        │   │   └── TransactionRepository.java    # MongoDB queries for purchase history
        │   │
        │   ├── model/
        │   │   ├── AIModel.java                  # MongoDB document: id, name, ipfsCID, price, ownerAddress
        │   │   ├── User.java                     # MongoDB document: walletAddress, username, uploadedModels
        │   │   └── Transaction.java              # MongoDB document: buyerAddress, modelId, txHash, amount
        │   │
        │   ├── dto/
        │   │   ├── AuthRequest.java              # Request body for login: walletAddress, message, signature
        │   │   ├── AuthResponse.java             # Response after login: JWT token, walletAddress
        │   │   ├── ModelUploadRequest.java       # Request body for upload: name, description, price
        │   │   ├── ModelResponse.java            # Response when fetching a model: all model fields
        │   │   ├── InferenceRequest.java         # Request body for inference: modelId, inputData
        │   │   └── InferenceResponse.java        # Response from inference: predictions, time taken
        │   │
        │   ├── security/
        │   │   ├── JwtAuthFilter.java            # Runs on every request — reads JWT from header, sets auth
        │   │   ├── WalletAuthProvider.java       # Recovers wallet address from Ethereum signature
        │   │   └── UserPrincipal.java            # Holds the logged-in user's wallet address for Spring Security
        │   │
        │   └── exception/
        │       ├── GlobalExceptionHandler.java   # Catches all errors, returns clean JSON error response
        │       ├── ModelNotFoundException.java   # Thrown when model ID doesnt exist in DB
        │       └── AccessDeniedException.java    # Thrown when user tries to run model they havent bought
        │
        └── resources/
            ├── application.properties            # Main config: port, MongoDB URI, JWT secret, API keys
            └── application-dev.properties        # Dev overrides: local DB, verbose logging
```

**What each layer does in plain English:**

- **controller/** — receives HTTP requests, calls service, returns response. Keep it thin, no logic here.
- **service/** — all the actual business logic lives here. This is where you write the real code.
- **repository/** — just interfaces that extend MongoRepository. Spring generates the DB queries for you.
- **model/** — Java classes that map directly to MongoDB collections.
- **dto/** — simple classes used just to send/receive data in API requests. Keeps your DB models clean.
- **security/** — JWT filter runs before every request to check if the user is logged in.
- **exception/** — one place to handle all errors cleanly instead of try-catch everywhere.

---

### 🌐 `frontend/` — React App

```
frontend/
├── index.html                      # HTML shell, React mounts here
├── vite.config.js                  # Vite config, proxy /api calls to backend port 8080
├── package.json                    # React, ethers.js, TailwindCSS dependencies
├── tailwind.config.js              # Tailwind custom colors and fonts
└── src/
    ├── main.jsx                    # Entry point, renders <App/> into the DOM
    ├── App.jsx                     # Sets up React Router, wraps app in WalletContext
    │
    ├── components/
    │   ├── Navbar.jsx              # Top bar with logo and wallet connect button
    │   ├── ModelCard.jsx           # Card showing model name, category, price
    │   ├── WalletConnect.jsx       # MetaMask connect button, shows short address when connected
    │   ├── UploadModal.jsx         # Popup form to upload a new model
    │   └── InferencePanel.jsx      # Input box + results display for running a model
    │
    ├── pages/
    │   ├── Home.jsx                # Landing page with model grid and search
    │   ├── Upload.jsx              # Upload page: fill form → upload file → sign on-chain
    │   ├── ModelDetail.jsx         # Single model page: description, price, Buy button, Run button
    │   └── Dashboard.jsx          # User profile: their uploads, purchases, earnings
    │
    ├── hooks/
    │   ├── useWallet.js            # Custom hook: connect MetaMask, get address and signer
    │   ├── useContract.js          # Custom hook: returns ready-to-use ethers Contract instances
    │   └── useIPFS.js              # Custom hook: fetch model files from IPFS gateway
    │
    ├── context/
    │   └── WalletContext.jsx       # Global state: wallet address, signer, chain ID
    │
    └── utils/
        ├── contract.utils.js       # Loads contract ABI and address, returns ethers Contract
        ├── api.utils.js            # Axios instance with JWT token auto-attached to headers
        └── format.utils.js         # Helpers: shorten 0x123...abc, format ETH, format dates
```

---

### 🐍 `ml-service/` — Python Inference Microservice

```
ml-service/
├── main.py                 # Starts FastAPI server, registers the /infer route
├── requirements.txt        # Python packages: fastapi, uvicorn, torch, sklearn, onnxruntime
├── routers/
│   └── inference.py        # POST /infer — receives input data, returns predictions
├── services/
│   ├── loader.py           # Downloads model file from IPFS, loads it into memory, caches it
│   └── runner.py           # Runs the loaded model on input data, returns predictions
└── schemas/
    └── request.py          # Pydantic classes: InferenceRequest, InferenceResponse shapes
```

---

## 🔐 Core Algorithms (Simple Version)

### Wallet Login Flow

```
1. User clicks "Connect Wallet" → MetaMask opens
2. Frontend asks user to sign a message like "Login to AI Marketplace - timestamp"
3. Frontend sends { walletAddress, signature, message } to POST /api/auth/verify
4. Backend recovers the signer address from the signature using Web3j
5. If recovered address == walletAddress → generate JWT token and return it
6. Frontend stores JWT, attaches it to every future API request
```

### Upload a Model

```
1. User fills form (name, price, description) and picks a file
2. Frontend signs an auth message and sends everything to POST /api/models
3. Backend (ModelService):
   a. Upload file to Pinata → get IPFS CID
   b. Call ModelRegistry.sol → registerModel(name, CID, price) → get onChainId
   c. Save { name, CID, price, walletAddress, onChainId } to MongoDB
4. Return model details to frontend
```

### Buy a Model

```
1. User clicks Buy on ModelDetail page
2. Frontend calls Marketplace.sol → purchaseAccess(modelId) with ETH value
3. Smart contract: sends 95% ETH to owner, records buyer has access
4. Frontend waits for transaction confirmation
5. Frontend calls POST /api/purchase/record to save tx to MongoDB
6. Buy button replaced by "Run Model" button
```

### Run Inference

```
1. User enters input data and clicks Run
2. Frontend calls POST /api/infer with { modelId, inputData }
3. Backend (InferenceService):
   a. Fetch model from MongoDB → get IPFS CID
   b. Call Marketplace.sol → hasAccess(modelId, walletAddress) → must be true
   c. Call Python FastAPI: POST http://ml-service:8000/infer { ipfsCID, inputData }
4. Python service: download model from IPFS → run prediction → return result
5. Backend returns predictions to frontend
```

---

## ⚙️ Setup

### Prerequisites

- Java 17+, Maven 3.8+
- Node.js 18+
- Python 3.10+
- MongoDB running locally (or MongoDB Atlas free tier)
- MetaMask installed in browser

### Step 1 — Clone

```bash
git clone https://github.com/yourusername/decentralized-ai-marketplace.git
cd decentralized-ai-marketplace
```

### Step 2 — Configure Backend

Edit `backend/src/main/resources/application.properties`:

```properties
server.port=8080
spring.data.mongodb.uri=mongodb://localhost:27017/ai-marketplace

jwt.secret=your_secret_key_at_least_32_characters_long
jwt.expiration=86400000

pinata.jwt=your_pinata_jwt_token

web3j.client-address=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
contract.registry.address=0xPasteAddressAfterDeploy
contract.marketplace.address=0xPasteAddressAfterDeploy

mlservice.url=http://localhost:8000
```

### Step 3 — Configure Frontend

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8080
VITE_CONTRACT_REGISTRY=0xPasteAddressAfterDeploy
VITE_CONTRACT_MARKETPLACE=0xPasteAddressAfterDeploy
VITE_CHAIN_ID=11155111
```

### Step 4 — Deploy Smart Contracts

```bash
cd blockchain
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
# Paste the printed addresses into application.properties and .env
```

### Step 5 — Start Backend

```bash
cd backend
mvn spring-boot:run
# Running on http://localhost:8080
```

### Step 6 — Start ML Service

```bash
cd ml-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Step 7 — Start Frontend

```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

---

## 📊 API Endpoints

| Method | Endpoint               | Auth | What it does                             |
| ------ | ---------------------- | ---- | ---------------------------------------- |
| POST   | `/api/auth/verify`     | No   | Login with wallet signature, returns JWT |
| GET    | `/api/models`          | No   | Get all models                           |
| GET    | `/api/models/{id}`     | No   | Get one model by ID                      |
| POST   | `/api/models`          | JWT  | Upload a new model                       |
| POST   | `/api/purchase/record` | JWT  | Save a completed purchase to DB          |
| POST   | `/api/infer`           | JWT  | Run inference on a model                 |
| GET    | `/api/users/{address}` | No   | Get user profile                         |

---

## 📦 Key Dependencies

**`pom.xml` (Java)**

```xml
spring-boot-starter-web           <!-- REST API -->
spring-boot-starter-security      <!-- JWT + route protection -->
spring-boot-starter-data-mongodb  <!-- MongoDB -->
web3j-core                        <!-- Talk to Ethereum contracts -->
jjwt-api + jjwt-impl              <!-- Create and validate JWT tokens -->
```

**`package.json` (Frontend)**

```
react, react-router-dom   — UI and routing
ethers                    — Talk to MetaMask and smart contracts
axios                     — HTTP requests to backend
tailwindcss               — Styling
```

**`requirements.txt` (Python)**

```
fastapi, uvicorn          — Web server
scikit-learn, torch       — Run ML models
onnxruntime               — Run ONNX format models
requests, numpy, pydantic — Utilities
```

---

## 📄 License

MIT — do whatever you want with it.
