# 🛠️ Coding Order Guide — Decentralized AI Marketplace

> Follow this exact order. Each step builds on the previous one. Don't skip ahead.

---

## 🗺️ Big Picture Order

```
Smart Contracts → Java Backend → Python ML Service → React Frontend
```

The reason for this order:
- Contracts give you the deployed addresses that backend needs
- Backend gives you the APIs that frontend calls
- ML service is independent, can be built anytime after backend

---

## PHASE 1 — Smart Contracts 🔗
*Do this first. Everything depends on the contract addresses.*

---

### Step 1 — Project Setup
```bash
mkdir decentralized-ai-marketplace && cd decentralized-ai-marketplace
mkdir blockchain && cd blockchain
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init   # choose "Create a JavaScript project"
```

---

### Step 2 — `hardhat.config.js`
Set up Sepolia network + your Alchemy key + Etherscan key.
Just fill in the networks section with your API keys.
Test: `npx hardhat compile` should work with no errors.

---

### Step 3 — `contracts/ModelRegistry.sol`
Write this first. It's the core — stores model ownership on-chain.

What to code:
- Struct `Model` with fields: id, name, ipfsHash, price, owner, active
- Mapping: `modelId → Model`
- Function `registerModel(name, ipfsHash, price)` — saves model, emits event
- Function `getModel(modelId)` — returns model details
- Function `deactivateModel(modelId)` — only owner can call

Test it works before moving on.

---

### Step 4 — `contracts/Marketplace.sol`
Handles money. Write this second.

What to code:
- Mapping: `modelId → buyerAddress → bool` (who has access)
- Function `purchaseAccess(modelId)` — payable, splits ETH, records access
- Function `hasAccess(modelId, userAddress)` — returns true/false
- Function `withdrawFees()` — only admin

---

### Step 5 — `contracts/AccessControl.sol`
Simplest contract. Write last.

What to code:
- Mapping: `modelId → address → role`
- Function `grantRole(modelId, user, role)`
- Function `checkAccess(modelId, user)` — returns role

---

### Step 6 — `test/ModelRegistry.test.js` + `test/Marketplace.test.js`
Write basic tests:
- Can register a model
- Can't register with zero price
- Can purchase access
- Can't purchase twice
- `hasAccess` returns correct value

Run: `npx hardhat test` — all should pass ✅

---

### Step 7 — `scripts/deploy.js`
Deploy all 3 contracts in one script.
Print the addresses after deploy.

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

**🚨 Copy the 2 addresses it prints. You'll need them in Phase 2.**

---

## PHASE 2 — Java Spring Boot Backend ☕
*Build in this exact order inside the backend folder.*

```bash
# Go to start.spring.io and generate project with:
# Dependencies: Spring Web, Spring Security, Spring Data MongoDB, Lombok
# Then add web3j and jjwt manually in pom.xml
```

---

### Step 8 — `pom.xml`
Add these dependencies manually after generating:
```xml
<!-- Ethereum -->
<dependency>org.web3j → core → 4.10.3</dependency>

<!-- JWT -->
<dependency>io.jsonwebtoken → jjwt-api → 0.12.3</dependency>
<dependency>io.jsonwebtoken → jjwt-impl → 0.12.3</dependency>
<dependency>io.jsonwebtoken → jjwt-jackson → 0.12.3</dependency>
```

Run `mvn install` — should download everything with no errors.

---

### Step 9 — `application.properties`
Fill in all config values:
- MongoDB URI
- JWT secret
- Pinata JWT token
- Alchemy Sepolia URL
- Both contract addresses from Step 7
- ML service URL

**Don't hardcode secrets — use this file and add it to .gitignore**

---

### Step 10 — `model/` — Entity Classes
Code these 3 files first. They're just simple Java classes with fields.

`AIModel.java` — fields: id, name, ipfsCID, metadataCID, price, ownerAddress, onChainId, createdAt

`User.java` — fields: id, walletAddress, username, bio

`Transaction.java` — fields: id, buyerAddress, modelId, txHash, amountEth, createdAt

Just add `@Document`, `@Id`, and `@Data` (Lombok) annotations. Nothing complex.

---

### Step 11 — `repository/` — DB Interfaces
3 files, barely any code. Spring does the work.

```java
// Example — all 3 look like this
public interface ModelRepository extends MongoRepository<AIModel, String> {
    List<AIModel> findByOwnerAddress(String address);
}
```

Write `ModelRepository`, `UserRepository`, `TransactionRepository`.

---

### Step 12 — `dto/` — Request & Response Classes
Plain Java classes. No logic, just fields.

Code in this order:
1. `AuthRequest.java` — walletAddress, message, signature
2. `AuthResponse.java` — token, walletAddress
3. `ModelUploadRequest.java` — name, description, price, category
4. `ModelResponse.java` — all model fields to return to frontend
5. `InferenceRequest.java` — modelId, inputData (Map)
6. `InferenceResponse.java` — predictions (List), inferenceTimeMs

---

### Step 13 — `config/MongoConfig.java`
Just reads MongoDB URI from application.properties and connects.
Test: run the app, should connect to MongoDB with no errors.

---

### Step 14 — `config/Web3jConfig.java`
Creates a Web3j bean using your Alchemy URL.
```java
@Bean
public Web3j web3j() {
    return Web3j.build(new HttpService(alchemyUrl));
}
```
Test: app should still start fine.

---

### Step 15 — `config/PinataConfig.java`
Stores your Pinata JWT token as a bean.
Just reads from application.properties. One `@Value` field.

---

### Step 16 — `service/JwtService.java`
Two functions only:

`generateToken(walletAddress)` — creates a JWT signed with your secret, expires in 24h

`validateToken(token)` — parses the JWT, returns the walletAddress inside it

Test this in isolation before moving on. Write a quick main method test.

---

### Step 17 — `security/WalletAuthProvider.java`
One function: takes a message + signature, recovers the wallet address using Web3j.

```
Sign.signedMessageToKey(messageHash, signatureData) → gives you public key → derive address
```

This is the trickiest part of the whole backend. Take your time here.

---

### Step 18 — `security/JwtAuthFilter.java`
Runs before every request:
1. Read `Authorization: Bearer <token>` header
2. Call `JwtService.validateToken(token)` → get walletAddress
3. Set the user in Spring Security context
4. Call `filterChain.doFilter()`

---

### Step 19 — `security/UserPrincipal.java`
Simple wrapper. Holds walletAddress, implements `UserDetails`.
Just return the walletAddress from `getUsername()`. Everything else can return defaults.

---

### Step 20 — `config/SecurityConfig.java`
Wire everything together:
- Add `JwtAuthFilter` to the filter chain
- Make `/api/auth/**` and `GET /api/models` public
- Require JWT for everything else
- Enable CORS for `http://localhost:5173`

Test: `POST /api/models` without a token should return 403. ✅

---

### Step 21 — `service/IpfsService.java`
Two functions:

`uploadFile(MultipartFile file)`:
1. Call Pinata API: `POST https://api.pinata.cloud/pinning/pinFileToIPFS`
2. Set header: `Authorization: Bearer YOUR_PINATA_JWT`
3. Send file as multipart body
4. Parse response JSON → return `IpfsHash` field (that's your CID)

`uploadMetadata(Map data)`:
1. Call `POST https://api.pinata.cloud/pinning/pinJSONToIPFS`
2. Send metadata as JSON body
3. Return `IpfsHash`

Test with a dummy file upload before wiring into ModelService.

---

### Step 22 — `service/BlockchainService.java`
Two functions:

`registerModelOnChain(name, ipfsCID, price, ownerAddress)`:
1. Load ModelRegistry contract using Web3j
2. Call `registerModel()` function on the contract
3. Wait for receipt
4. Extract and return the `modelId` from the event log

`hasAccess(onChainModelId, userAddress)`:
1. Load Marketplace contract (read-only, no gas needed)
2. Call `hasAccess()` view function
3. Return boolean

---

### Step 23 — `service/ModelService.java`
Wires IpfsService + BlockchainService + Repository together:

`uploadModel(file, request, walletAddress)`:
1. Call `ipfsService.uploadFile(file)` → fileCID
2. Call `ipfsService.uploadMetadata(...)` → metadataCID
3. Call `blockchainService.registerModelOnChain(...)` → onChainId
4. Save new `AIModel` to MongoDB
5. Return `ModelResponse`

`getAllModels()` → just calls `modelRepository.findAll()`

`getById(id)` → find by ID or throw `ModelNotFoundException`

---

### Step 24 — `controller/AuthController.java`
```
POST /api/auth/verify
1. Receive AuthRequest { walletAddress, message, signature }
2. Call WalletAuthProvider.recoverAddress(message, signature)
3. Compare with walletAddress
4. If match → return JWT via JwtService.generateToken()
5. Else → return 401
```

**Test this with Postman right now before going further.**
Send a real MetaMask signature and confirm you get a JWT back.

---

### Step 25 — `controller/ModelController.java`
```
GET  /api/models           → modelService.getAllModels()
GET  /api/models/{id}      → modelService.getById(id)
POST /api/models           → modelService.uploadModel(file, request, walletAddress)
GET  /api/models/user/{address} → modelService.getByOwner(address)
```

**Test all 4 endpoints in Postman.**

---

### Step 26 — `exception/` — Error Handling
Code `ModelNotFoundException` and `AccessDeniedException` (just extend RuntimeException).

Then code `GlobalExceptionHandler.java` with `@ControllerAdvice`:
- Catch each exception
- Return proper HTTP status + JSON message

Now all your errors look clean instead of ugly stack traces.

---

### Step 27 — `service/InferenceService.java` + `controller/InferenceController.java`
Leave these for after the ML service is ready (Phase 3).
For now just create the files and leave them empty.

---

## PHASE 3 — Python ML Service 🐍
*Can be built independently. Short phase.*

---

### Step 28 — `requirements.txt` + setup
```bash
mkdir ml-service && cd ml-service
pip install fastapi uvicorn scikit-learn torch onnxruntime numpy requests pydantic
pip freeze > requirements.txt
```

---

### Step 29 — `schemas/request.py`
Two Pydantic classes:
```python
class InferenceRequest(BaseModel):
    ipfsCID: str
    inputData: list
    modelType: str  # "sklearn" / "torch" / "onnx"

class InferenceResponse(BaseModel):
    predictions: list
    inference_time_ms: float
```

---

### Step 30 — `services/loader.py`
```
loadModel(ipfsCID):
1. Check if model already in memory cache dict → return it
2. Else download from: https://ipfs.io/ipfs/{CID}
3. Save to /tmp/{CID}
4. Detect format and load (joblib / torch.load / onnxruntime)
5. Store in cache, return model
```

---

### Step 31 — `services/runner.py`
```
runInference(model, inputData, modelType):
1. Convert inputData to numpy array
2. Run prediction based on modelType
3. Return predictions as plain list
```

---

### Step 32 — `routers/inference.py` + `main.py`
Wire up the POST `/infer` route:
1. Receive `InferenceRequest`
2. Call `loader.loadModel(ipfsCID)`
3. Call `runner.runInference(model, inputData)`
4. Return `InferenceResponse`

Test: `uvicorn main:app --reload` then hit `/infer` with Postman using a real sklearn model CID.

---

### Step 33 — Back to Java: `service/InferenceService.java`
Now that ML service works, finish this:
```
runInference(modelId, inputData, walletAddress):
1. Find model in MongoDB → get ipfsCID and onChainId
2. Call blockchainService.hasAccess(onChainId, walletAddress)
3. If false → throw AccessDeniedException
4. Build HTTP request to Python service
5. POST { ipfsCID, inputData } to http://localhost:8000/infer
6. Return the predictions
```

And finish `InferenceController.java` → `POST /api/infer`

---

## PHASE 4 — React Frontend 🌐
*Build after backend is working and tested.*

---

### Step 34 — Project Setup
```bash
cd ..
npm create vite@latest frontend -- --template react
cd frontend
npm install ethers axios react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

### Step 35 — `utils/api.utils.js`
Axios instance that reads JWT from localStorage and attaches it to every request.
```js
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL })
api.interceptors.request.use(config => {
  const token = localStorage.getItem('jwt')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

---

### Step 36 — `utils/contract.utils.js`
Loads contract ABI from `deployments/` folder and returns an ethers Contract instance.
```js
export function getMarketplaceContract(signer) {
  return new ethers.Contract(MARKETPLACE_ADDRESS, MarketplaceABI, signer)
}
```

---

### Step 37 — `context/WalletContext.jsx`
Global state that holds: `address`, `signer`, `isConnected`.
Wrap your whole app in this so any component can access wallet info.

---

### Step 38 — `hooks/useWallet.js`
```
connectWallet():
1. Check window.ethereum exists
2. Request MetaMask accounts
3. Create ethers provider + signer
4. Save to WalletContext
5. Listen for account/chain changes
```

---

### Step 39 — `components/Navbar.jsx` + `components/WalletConnect.jsx`
Build the navbar first — it's on every page.
`WalletConnect` button: shows "Connect Wallet" or shortened `0x123...abc` address.

---

### Step 40 — `App.jsx` + Routes
Set up React Router with these routes:
```
/           → Home.jsx
/upload     → Upload.jsx
/models/:id → ModelDetail.jsx
/dashboard  → Dashboard.jsx
```

---

### Step 41 — `pages/Home.jsx`
1. Call `GET /api/models` on load
2. Display results as a grid of `ModelCard` components
3. Add a search bar that filters by name

---

### Step 42 — `pages/Upload.jsx`
Multi-step form:
1. Fill in name, description, price, pick a file
2. On submit: sign auth message, POST to `/api/models` with JWT
3. Show progress: Uploading... → Registering on chain... → Done!
4. Redirect to the new model's page

---

### Step 43 — `pages/ModelDetail.jsx`
1. Fetch model details from `GET /api/models/{id}`
2. Check `contract.hasAccess(modelId, address)` — show Buy or Run button
3. Buy button: call `contract.purchaseAccess()` with ETH → wait for tx → show Run button
4. Run button: shows `InferencePanel`

---

### Step 44 — `components/InferencePanel.jsx`
1. Text area for user to paste input data (JSON format)
2. Submit button calls `POST /api/infer`
3. Display the predictions in a result box below

---

### Step 45 — `pages/Dashboard.jsx`
1. Fetch user's uploaded models: `GET /api/models/user/{address}`
2. Show them in a list with earnings
3. Add a shortcut Upload button

---

## ✅ Final Checklist Before Calling It Done

```
Blockchain
  ☐ All 3 contracts compile and deploy
  ☐ Tests pass for registry and marketplace
  ☐ Contract addresses saved in backend config and frontend .env

Backend
  ☐ Wallet login returns JWT
  ☐ Upload model: file goes to IPFS, registers on-chain, saves to DB
  ☐ GET /api/models returns models from DB
  ☐ Inference checks on-chain access before running
  ☐ Error responses are clean JSON

ML Service
  ☐ POST /infer works with a real sklearn model
  ☐ Model caching works (second request is faster)

Frontend
  ☐ MetaMask connects and stores address
  ☐ Can browse models without wallet
  ☐ Can upload a model with wallet connected
  ☐ Buy button sends ETH transaction
  ☐ Inference panel shows results
```

---

## 💡 Tips

- **Test each phase with Postman before moving to the next.** Don't build the frontend on a broken backend.
- **Keep a `notes.md` file** where you paste contract addresses, test wallet addresses, and CIDs as you go.
- **Start with a simple sklearn model** (like a trained iris classifier) to test the full flow end-to-end before worrying about torch/onnx support.
- **Use MongoDB Compass** (free GUI) to visually check that data is saving correctly.
- **If Web3j feels complex**, the `WalletAuthProvider` signature recovery is the hardest part — look up "web3j ECRecover example" and you'll find copy-paste ready code.
