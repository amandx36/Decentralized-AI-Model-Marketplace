STEP 0: Initial State

Database:

{
"walletAddress": "0xABC",
"nonce": null
}
🧱 STEP 1: Request Nonce

Frontend → /request-nonce

Backend:

nonce = "Login..." + UUID
save nonce in DB

DB becomes:

{
"walletAddress": "0xABC",
"nonce": "Login123"
}
🧱 STEP 2: MetaMask Signing

Frontend sends to MetaMask:

message = "Login123"

MetaMask does:

signature = SIGN(message, privateKey)

Returns:

{
"message": "Login123",
"signature": "0xXYZ..."
}
🧱 STEP 3: Backend Verification

You receive:

{
"walletAddress": "0xABC",
"message": "Login123",
"signature": "0xXYZ..."
}
🔍 INTERNAL WORKING (CRITICAL PART)
🔹 STEP 3.1: Check nonce
if (!message.equals(user.getNonce()))

👉 Ensures:

Frontend message == DB nonce
🔹 STEP 3.2: Recover public key
(message + signature) → ECDSA recovery → publicKey
🔹 STEP 3.3: Convert to wallet address
publicKey → hash → walletAddress
🔹 STEP 3.4: Compare
if (!recoveredAddress.equals(walletAddress))