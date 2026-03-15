Nonce System (Important for Wallet Security)

Right now your login is:

walletAddress → generate JWT

That is not secure because anyone can send any wallet address.

Proper Web3 login uses nonce + signature.

What you should implement

Add field in User:

private String nonce;

Create a service:

NonceService

Example:

generateNonce()
validateNonce()

Example implementation idea:

public String generateNonce() {
return UUID.randomUUID().toString();
}
Create endpoint
POST /api/auth/request-nonce

Flow:

Client → walletAddress
Backend → generate nonce
Backend → store nonce in DB
Backend → return nonce

Example response:

{
"nonce": "Login to AI Marketplace: 923847"
}
2️⃣ Signature Verification (Web3 Login)

After nonce generation:

User signs message in MetaMask.

Then call:

POST /api/auth/verify

Request:

{
"walletAddress": "...",
"message": "...",
"signature": "..."
}

Backend should:

verifySignature(message, signature, walletAddress)

If valid:

generate JWT

You can implement this later with Web3j.

For Phase-1 you can mock verification.

3️⃣ Add CreatedAt and LastLogin Fields

Your User entity should include:

private Instant createdAt;
private Instant lastLogin;

Update logic:

newUser.setCreatedAt(Instant.now());
user.setLastLogin(Instant.now());

This is important for user tracking.

4️⃣ Add Global Exception Handler

Right now errors might return messy responses.

Create:

exception/GlobalExceptionHandler

Example:

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handle(Exception e){
        return ResponseEntity
               .status(HttpStatus.INTERNAL_SERVER_ERROR)
               .body("Something went wrong");
    }
}

This keeps API responses clean and consistent.

5️⃣ Add Health Check Endpoint

Create controller:

GET /health

Example response:

{
"status": "UP"
}

This helps monitoring tools and Docker health checks.

Final Phase-1 Architecture

After adding these improvements your backend will include:

config/
SecurityConfig
CorsConfig

controller/
AuthController
HealthController

service/
AuthService
NonceService
JwtService

repository/
UserRepository

entity/
User

security/
JwtAuthFilter
UserPrincipal

dto/
LoginRequest
LoginResponse

exception/
GlobalExceptionHandler
Phase-1 Final API Endpoints
POST /api/auth/request-nonce
POST /api/auth/verify
POST /api/auth/login   (optional simple login)

GET  /health

Protected APIs require:

Authorization: Bearer <JWT>