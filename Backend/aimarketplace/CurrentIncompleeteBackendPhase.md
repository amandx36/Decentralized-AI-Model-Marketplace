Client
│
│ POST /api/auth/login
│ { walletAddress }
▼
LoginController
│
▼
AuthService.verifyLogin()
│
▼
UserRepository.findByWalletAddress()
│
├── User exists → use existing user
│
└── User not exist
│
▼
Create new User
Save in MongoDB
│
▼
JwtService.generateToken(walletAddress)
│
▼
LoginResponse
│
▼
Client receives JWT token



Protected api request flow
Client Request
│
▼
SecurityFilterChain
│
▼
JwtAuthFilter
│
▼
Extract Authorization Header
│
▼
Extract JWT token
│
▼
JwtService.validateToken()
│
▼
Extract walletAddress from token
│
▼
Create Authentication Object
│
▼
Store in SecurityContextHolder
│
▼
Controller executes API
│
▼
Response returned to client



my current security behaviour



/api/auth/login   → public
/health           → public
all other APIs    → require JWT