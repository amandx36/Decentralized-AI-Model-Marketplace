# 🔐 Web3 Authentication Flow (Nonce + Signature + JWT)

This system implements **passwordless authentication using Ethereum wallets** (MetaMask) based on **EIP-191 signed messages**.

---

## 🧠 Core Idea

Instead of passwords:

* Backend generates a **nonce (one-time challenge)**
* User signs it using their **private key (MetaMask)**
* Backend verifies signature → proves wallet ownership
* JWT is issued

---

## 🧱 SYSTEM FLOW

---

## 🔹 STEP 0: Initial State

Database:

```
{
  "walletAddress": "0xABC",
  "nonce": null
}
```

Redis:

```
(empty)
```

---

## 🔹 STEP 1: Request Nonce

### 📡 API Call

```
POST /auth/request-nonce
```

### ⚙️ Backend Logic

1. Check if user exists:

```java
userRepository.findByWalletAddress(walletAddress)
```

2. If not → create new user

3. Generate nonce:

```java
byte[32] → SecureRandom → hex string
```

4. Store nonce in Redis:

```
key = "nonce:" + walletAddress
value = nonce
TTL = 5 minutes
```

### 📦 Redis State

```
nonce:0xABC → "a1b2c3..."
```

### 📤 Response

```
{
  "nonce": "a1b2c3..."
}
```

---

## 🔹 STEP 2: MetaMask Signing (Client Side)

Frontend sends nonce to MetaMask:

```
message = nonce
```

MetaMask internally performs:

### ✍️ Signing Process (EIP-191)

```
prefixedMessage =
"\x19Ethereum Signed Message:\n" + len(message) + message
```

Then:

```
keccak256(prefixedMessage) → hash
ECDSA_sign(hash, privateKey) → (r, s, v)
```

### 📤 Output

```
{
  "message": "a1b2c3...",
  "signature": "0x{r}{s}{v}"
}
```

---

## 🔹 STEP 3: Backend Verification

### 📡 API Call

```
POST /auth/login
```

Payload:

```
walletAddress
message
signature
```

---

## 🔍 INTERNAL VERIFICATION FLOW

---

### 🔸 STEP 3.1: Fetch Nonce

```java
storedNonce = nonceService.getNonce(walletAddress)
```

❗ If null:

* Expired OR not found → reject

---

### 🔸 STEP 3.2: Validate Nonce

```java
if (!message.equals(storedNonce))
```

✅ Ensures:

* Message is not tampered
* Prevents replay attack

---

### 🔸 STEP 3.3: Signature Decoding

Signature structure:

```
65 bytes total:
- r (32 bytes)
- s (32 bytes)
- v (1 byte)
```

```java
byte[] sigBytes = hex → byte[]
r = [0..32]
s = [32..64]
v = sigBytes[64]
```

Normalize:

```java
if (v < 27) v += 27;
```

---

### 🔸 STEP 3.4: Recreate Message Hash

Same as MetaMask:

```
prefix + message → keccak256 → msgHash
```

---

### 🔸 STEP 3.5: Recover Public Key

Using:

```java
Sign.signedMessageToKey(msgHash, sigData)
```

This performs:

```
ECDSA Recovery → Public Key
```

---

### 🔸 STEP 3.6: Derive Wallet Address

```
keccak256(publicKey) → last 20 bytes → address
```

---

### 🔸 STEP 3.7: Compare Addresses

```java
if (!recoveredAddress.equalsIgnoreCase(walletAddress))
```

❌ If mismatch → reject
✅ If match → authenticated

---

### 🔸 STEP 3.8: Cleanup Nonce

```java
nonceService.deleteNonce(walletAddress)
```

✅ Prevents replay attacks

---

### 🔸 STEP 3.9: Generate JWT

```java
jwtService.generateToken(walletAddress)
```

---

## 🔐 FINAL RESPONSE

```
{
  "token": "JWT_TOKEN"
}
```

---

## 🛡️ SECURITY GUARANTEES

### ✅ Ownership Proof

Only wallet owner can sign nonce

### ✅ Replay Protection

Nonce is:

* One-time use
* Time-limited (5 min)
* Deleted after login

### ✅ Tamper Protection

Message must match stored nonce

### ✅ Signature Integrity

ECDSA ensures authenticity

---

## ⚙️ TECH STACK

* Java + Spring Boot
* Redis (nonce storage)
* Web3j (crypto + signature recovery)
* JWT (session management)

---

## 🔄 COMPLETE FLOW SUMMARY

```
Client → Request Nonce
Backend → Generate + Store (Redis)

Client → Sign Nonce (MetaMask)

Client → Send (message + signature)

Backend:
  → Validate nonce
  → Recover public key
  → Derive address
  → Compare
  → Delete nonce
  → Issue JWT
```

---

## 🚀 RESULT

Passwordless, decentralized, secure authentication using Ethereum wallet signatures.
