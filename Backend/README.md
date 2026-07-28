# AI Marketplace Backend - Phase 1: Foundation & Wallet Authentication

##  Project Overview

A Spring Boot backend for a Decentralized AI Model Marketplace with **MetaMask wallet authentication**, **JWT-based security**, and **MongoDB** storage. Built with modern security practices and web3 integration.

---

##  Phase 1 Implementation Status

### Core Components Implemented

-  Spring Boot 2.7.0 with Spring Security
-  MongoDB Integration (Atlas compatible)
-  JWT Authentication (Access + Refresh tokens)
-  MetaMask Wallet Authentication (Web3 signature verification)
-  Redis-based Nonce Management
-  CORS Configuration (React frontend support)
-  Global Exception Handling
-  User Model with Role-based Access Control

---

##  Project Architecture

```
com.aimarketplace.aimarketplace/
├── config/
│   ├── SecurityConfig.java          # JWT & security configuration
│   ├── CorsConfig.java              # CORS for frontend
│   └── RedisConfig.java             # Redis template setup
├── controller/
│   ├── AuthController.java          # /auth endpoints
│   └── TestController.java          # /test endpoints (NEW)
├── service/
│   ├── AuthService.java             # Authentication business logic
│   └── NonceService.java            # Nonce generation & validation
├── dto/
│   ├── request/
│   │   ├── NonceRequest.java        # Nonce request payload
│   │   └── VerifyRequest.java       # Wallet verification payload
│   └── response/
│       ├── AuthResponse.java        # Standardized auth response (NEW)
│       └── LoginResponse.java       # Legacy response model
├── entity/
│   ├── User.java                    # MongoDB user model
│   └── Role.java                    # User roles
├── exception/
│   └── GlobalExceptionHandler.java  # Centralized error handling (NEW)
├── repository/
│   ├── UserRepository.java          # MongoDB queries
│   └── RoleRepository.java          # Role queries
└── security/
    ├── UserPrincipal.java           # Spring UserDetails implementation
    └── jwt/
        ├── JwtService.java          # JWT generation & validation (ENHANCED)
        ├── JwtAuthFilter.java       # JWT request filter (FIXED)
        └── Web3SignatureUtil.java   # Ethereum signature verification
```

---

##  Technology Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| Spring Boot | 2.7.0 | Web framework |
| Spring Security | 2.7.0 | Authentication & authorization |
| MongoDB | - | NoSQL database |
| Redis | - | Nonce & session management |
| Web3j | 4.10.3 | Ethereum signature verification |
| JWT (JJWT) | 0.11.5 | Token generation & validation |
| Lombok | Latest | Reduce boilerplate code |
| Java | 17 | Runtime |

---

##  API Endpoints

### Authentication Endpoints

#### 1. **Request Nonce** (Step 1 of Login)
```http
POST /api/auth/request-nonce
Content-Type: application/json

{
  "walletAddress": "0xAbC123...789"
}

Response (200):
{
  "nonce": "a3f2b8c9d1e4f6g7h9i0j1k2l3m4n5o6p7q8r9s0",
  "message": "Nonce generated successfully. Sign this nonce with your wallet."
}
```

#### 2. **Verify Signature & Login** (Step 2 of Login)
```http
POST /api/auth/verify
Content-Type: application/json

{
  "walletAddress": "0xAbC123...789",
  "message": "a3f2b8c9d1e4f6g7h9i0j1k2l3m4n5o6p7q8r9s0",
  "signature": "0x1234567890abcdef..."
}

Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "walletAddress": "0xAbC123...789",
  "role": "ROLE_USER",
  "message": "Login successful",
  "expiresIn": 86400
}
```

#### 3. **Refresh Access Token** (Optional)
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "walletAddress": "0xAbC123...789",
  "role": "ROLE_USER",
  "message": "Token refreshed successfully",
  "expiresIn": 86400
}
```

### Test Endpoints

#### 1. **Public Endpoint** (No auth required)
```http
GET /api/test/public

Response (200):
{
  "message": "This is a public endpoint - no authentication required",
  "timestamp": 1685012345000
}
```

#### 2. **Protected Endpoint** (JWT required)
```http
GET /api/test/private
Authorization: Bearer <access_token>

Response (200):
{
  "message": "This is a private endpoint - JWT required",
  "authenticated_user": "0xAbC123...789",
  "authorities": ["ROLE_USER"],
  "timestamp": 1685012345000
}
```

#### 3. **Health Check**
```http
GET /api/test/health

Response (200):
{
  "status": "UP",
  "service": "AI-Marketplace-Backend",
  "timestamp": 1685012345000
}
```

---

##  Authentication Flow

### Login Process (3 Steps)

```
1. Frontend requests nonce
   ├─> Backend generates random hex string
   ├─> Stores nonce in Redis (5 min expiry)
   └─> Returns nonce to frontend

2. Frontend signs nonce with MetaMask
   ├─> User approves signature in wallet
   └─> Frontend sends nonce + signature to backend

3. Backend verifies signature
   ├─> Validates nonce exists & not expired
   ├─> Recovers wallet address from signature
   ├─> Compares recovered address with request address
   ├─> Deletes nonce (prevent replay attacks)
   ├─> Generates JWT access token (24 hours)
   ├─> Generates refresh token (7 days)
   └─> Returns tokens to frontend
```

### Token Structure

**Access Token:** 24 hours expiration
- Used for API requests
- Include in `Authorization: Bearer <token>` header
- Expires quickly for security

**Refresh Token:** 7 days expiration
- Used to obtain new access token
- Stored securely on frontend
- Longer expiration for convenience

---

##  Setup & Installation

### Prerequisites

- Java 17+
- Maven 3.8+
- MongoDB (local or Atlas)
- Redis (local or Docker)
- Git

### 1. Clone Repository
```bash
git clone <repository-url>
cd Decentralized-AI-Model-Marketplace/Backend/aimarketplace
```

### 2. Install Dependencies
```bash
mvn clean install
```

### 3. Configure Environment

Create `application-local.yml` or set environment variables:

```yaml
# MongoDB
spring.data.mongodb.uri=mongodb://username:password@localhost:27017/aimarketplace

# Redis
spring.data.redis.host=localhost
spring.data.redis.port=6379

# JWT Secret (keep this SECRET!)
JWT_SECRET=your-super-secret-key-at-least-32-characters-long!!!
```

Or via environment variables:
```bash
export JWT_SECRET="your-super-secret-key-at-least-32-characters-long!!!"
export SPRING_DATA_MONGODB_URI="mongodb://user:pass@localhost:27017/aimarketplace"
```

### 4. Run Application
```bash
mvn spring-boot:run
```

Server starts on: `http://localhost:8000/api`

### 5. Run Tests
```bash
mvn test
```

---

##  Configuration Properties

Edit `application.yml`:

```yaml
spring:
  application:
    name: aimarketplace
  data:
    mongodb:
      uri: mongodb://root:root@localhost:27019/aimarketplace?authSource=admin
    redis:
      host: localhost
      port: 6379
      timeout: 60000ms

jwt:
  secret: ${JWT_SECRET:default-secret-key}
  expiration: 86400000          # 24 hours in milliseconds
  refresh-expiration: 604800000 # 7 days in milliseconds

server:
  port: 8000
  servlet:
    context-path: /api
```

---

##  Database Models

### User Model
```javascript
{
  _id: ObjectId,
  walletAddress: String (unique),
  ownedModel: [String],           // Array of model IDs
  purchasedModel: [String],       // Array of model IDs
  roles: [ObjectRef(Role)],       // Foreign key reference
  accountNonLocked: Boolean,
  createdAt: Date,
  modifiedAt: Date,
  failedAttempt: Long,
  lockTime: Date
}
```

### Role Model
```javascript
{
  _id: ObjectId,
  name: String (unique),          // e.g., "ROLE_USER", "ROLE_ADMIN"
  description: String
}
```

---

## Development & Code Changes

### Files Modified/Created in Phase 1

| File | Type | Change | Description |
|------|------|--------|-------------|
| `JwtAuthFilter.java` | Fix | Added missing `@Autowired JwtService` | Critical bug fix - filter was not injecting JwtService |
| `JwtService.java` | Enhanced | Added refresh token methods | `generateRefreshToken()`, `refreshAccessToken()` |
| `SecurityConfig.java` | Enhanced | Added test endpoints to permitAll | `/test/public`, `/test/health` now accessible |
| `AuthServiceimpl.java` | Enhanced | Returns AuthResponse object | Standardized response format with all token data |
| `AuthController.java` | Enhanced | Added `/refresh` endpoint | Token refresh functionality |
| `TestController.java` | New | Created test endpoints | `/test/public`, `/test/private`, `/test/health` |
| `AuthResponse.java` | New | Created standardized response DTO | Token, refreshToken, walletAddress, role, message, expiresIn |
| `GlobalExceptionHandler.java` | New | Centralized error handling | Consistent error responses across all endpoints |
| `application.yml` | Fixed | Corrected JWT config values | Proper expiration times & settings |
| `pom.xml` | Fixed | Removed duplicate test dependency | Clean build output |

### Key Improvements

1. **Security Enhancements:**
   - Fixed critical missing dependency injection in JwtAuthFilter
   - Added refresh token mechanism for token rotation
   - Nonce expiry prevents replay attacks

2. **Code Quality:**
   - Centralized exception handling
   - Standardized API responses
   - Proper configuration management
   - Removed duplicate dependencies

3. **Developer Experience:**
   - Test endpoints for quick validation
   - Health check endpoint for monitoring
   - Better error messages
   - Proper logging structure

---

##  Testing the API

### Using cURL

#### 1. Request Nonce
```bash
curl -X POST http://localhost:8000/api/auth/request-nonce \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0xYourWalletAddress"}'
```

#### 2. Verify & Login (requires MetaMask signature)
```bash
curl -X POST http://localhost:8000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress":"0xYourWalletAddress",
    "message":"nonce-from-step-1",
    "signature":"0xsignature-from-metamask"
  }'
```

#### 3. Test Protected Endpoint
```bash
curl http://localhost:8000/api/test/private \
  -H "Authorization: Bearer your-jwt-token"
```

### Using Postman

1. Import the collection (see `postman-collection.json` - to be created)
2. Set `baseUrl` = `http://localhost:8000/api`
3. Run requests in sequence

---

##  Frontend Integration (React/Vue)

### Installation
```javascript
// Install Web3
npm install web3 axios

// Or for ethers.js
npm install ethers axios
```

### Login Flow Example (React)
```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

// Step 1: Request Nonce
const requestNonce = async (walletAddress) => {
  const response = await axios.post(`${API_BASE}/auth/request-nonce`, {
    walletAddress
  });
  return response.data.nonce;
};

// Step 2: Sign Nonce & Verify
const verifySignature = async (walletAddress, message, signature) => {
  const response = await axios.post(`${API_BASE}/auth/verify`, {
    walletAddress,
    message,
    signature
  });
  
  // Store tokens
  localStorage.setItem('accessToken', response.data.token);
  localStorage.setItem('refreshToken', response.data.refreshToken);
  
  return response.data;
};

// Step 3: Refresh Token (when needed)
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  const response = await axios.post(`${API_BASE}/auth/refresh`, {
    refreshToken
  });
  
  localStorage.setItem('accessToken', response.data.token);
  return response.data.token;
};

// Attach token to all requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

##  Error Handling

### Common Error Responses

| Status | Error | Cause | Solution |
|--------|-------|-------|----------|
| 400 | "Invalid nonce" | Message doesn't match stored nonce | Request new nonce and retry |
| 400 | "Nonce not found or expired" | Nonce expired (5 min timeout) | Request new nonce |
| 400 | "Signature mismatch" | Recovered address ≠ wallet address | Sign with correct wallet |
| 401 | "User not found" | Wallet not in database | Contact admin |
| 401 | "Unauthorized" | Invalid or expired JWT token | Use refresh endpoint |
| 401 | "Refresh token has expired" | Refresh token > 7 days old | Request new nonce and login again |

---

##  Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Connect to MongoDB Atlas
mongodb+srv://username:password@cluster.mongodb.net/database
```

### Redis Connection Issues
```bash
# Check Redis
redis-cli ping

# Output should be: PONG
```

### Build Issues
```bash
# Clear Maven cache
mvn clean install -U

# Check Java version
java -version
# Should be 17+

# Rebuild
mvn clean package -DskipTests
```

### JWT Token Issues
- Ensure `JWT_SECRET` environment variable is set
- Check token expiration: `jwtDecoder.decode(token).getExpiresAt()`
- Verify signature hasn't been tampered with

---

##  Phase 2 Preview

Once Phase 1 is stable, Phase 2 will include:
- [ ] AI Model Upload & Management
- [ ] Smart Contract Integration
- [ ] Model Marketplace Listing
- [ ] Payment Processing
- [ ] Advanced User Profiles

---

##  Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add new feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit Pull Request

---

##  License

This project is part of the Decentralized AI Model Marketplace initiative.

---

##  Support

For issues and questions:
- GitHub Issues: [Project Issues]
- Email: support@aimarketplace.dev
- Discord: [Community Server]

---

##  Next Steps

1. **Test the API** using cURL/Postman
2. **Integrate with Frontend** using the provided React example
3. **Deploy to Production** (AWS/GCP/Azure)
4. **Monitor with Logs** (ELK stack recommended)

---amandx36