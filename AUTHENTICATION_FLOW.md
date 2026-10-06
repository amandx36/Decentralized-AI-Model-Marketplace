# Wallet Authentication Flow

## 1. Overview

The implemented login proves control of an Ethereum wallet by signing a Redis-backed nonce. The Spring Boot service recovers the signer, compares it to the requested address, then issues two HS256 JWTs. A Next.js route handler (the BFF) places these values in cookies. For backend API authentication, the access JWT must arrive in an `Authorization: Bearer ...` header; `JwtAuthFilter` resolves it to the MongoDB user and a Spring Security principal.

There are important differences between this implementation and a fully wired authenticated marketplace: the frontend middleware protects `/dashboard` only; the upload page is not guarded, although its BFF forwards the access token; and the Spring upload controller does not use the authenticated principal, check ownership, or call a service. The upload request URL also appears to contain a duplicated `/api` prefix given the backend context path and frontend target path (see sections 9 and 12).

## 2. Authentication Architecture

```text
Browser / Next.js login page
  ├─ window.ethereum: eth_requestAccounts, then personal_sign
  ├─ POST /api/auth/request-nonce ── Next.js BFF ── POST /api/auth/request-nonce ── Spring
  └─ POST /api/auth/verify ──────── Next.js BFF ── POST /api/auth/verify ──────── Spring
                                                              ├─ Redis: one-time nonce
                                                              ├─ MongoDB: User by wallet address
                                                              └─ web3j: EIP-191 signer recovery
                                                                          │
                                                                          └─ access JWT + refresh JWT
Browser cookies ◀──────────── Next.js BFF sets token, refresh, and wallet cookies
  │
  ├─ middleware checks access-cookie presence for /dashboard only
  └─ upload BFF reads HttpOnly access cookie and sends Authorization: Bearer JWT
                                      │
                                      ▼
Spring Security: JwtAuthFilter → UserPrincipal → SecurityContext
                                      │
                                      ▼
Controller (for upload, currently no principal/ownership use)
```

Spring is configured with `server.servlet.context-path=/api` in `Backend/aimarketplace/src/main/resources/application.properties`. Thus the auth controller mapping `/auth` is externally `/api/auth`. `ModelUploadController` maps `/api/v1/model-uploads`; with the same context path, its external mapping is `/api/api/v1/model-uploads` unless deployment routing rewrites the path. The frontend BFF constructs a backend URL ending `/api/v1/model-uploads`, so the path composition does not match the configured context path as written.

## 3. Complete Authentication Flow

1. A visitor opens the Next.js app. No global frontend route guard is applied. `Front-end/middleware.ts` runs on page routes and only guards `/dashboard` (and descendants), by checking whether the `aimarketplace_token` cookie is nonempty.
2. The visitor selects Connect wallet on `Front-end/app/login/page.tsx`. `connectWallet()` calls `window.ethereum.request({ method: 'eth_requestAccounts' })` and uses the first returned account.
3. The page posts `{ walletAddress }` to the Next.js `/api/auth/request-nonce` route. `Front-end/app/api/auth/[action]/route.ts` forwards the JSON to backend `/api/auth/request-nonce`.
4. `AuthController.requestNonce()` calls `AuthServiceimpl.generateAndSaveNonce()`. This finds or creates a MongoDB `User`, then `NonceServiceImpl` generates 32 cryptographically random bytes as lowercase hex and saves `nonce:<walletAddress>` in Redis with a five-minute TTL.
5. The browser encodes the returned nonce as UTF-8 bytes expressed as `0x` hex, and asks MetaMask for `personal_sign` with `[nonceHex, walletAddress]`.
6. The page posts `{ walletAddress, message: nonceData.nonce, signature }` to `/api/auth/verify`. The BFF forwards it to Spring.
7. `AuthServiceimpl.verifyAndLogin()` requires nonblank values, loads the user, retrieves the Redis nonce, compares the supplied message exactly, recovers the address using web3j's EIP-191 prefixed-message recovery, and compares addresses case-insensitively. On success it deletes the Redis nonce, generates access and refresh JWTs, updates `modifiedAt` on the MongoDB user, and returns `AuthResponse`.
8. When that successful response contains `token`, `refreshToken`, and `walletAddress`, the Next.js BFF sets four cookies. The login page then redirects to the `from` query value or `/dashboard`.
9. For later backend access, the frontend upload helper posts to the same-origin upload BFF. `serverFetch()` reads the HttpOnly access token via `getToken()` and forwards it as a bearer header. Spring's `JwtAuthFilter` parses/verifies the JWT, gets the subject wallet address, loads the Mongo user, creates `UserPrincipal` and `UsernamePasswordAuthenticationToken`, and sets it in `SecurityContextHolder`.

The login page does not send the token in its JSON verify request itself. The BFF reads the token and response only after Spring returns the successful `AuthResponse`.

## 4. Wallet Connection

`Front-end/app/login/page.tsx` declares the `window.ethereum` request interface and uses `connectWallet()`. It requests `eth_requestAccounts`, takes `accounts[0]`, and displays that address. If `window.ethereum` is missing or the account list is empty, it shows an error. No chain ID is requested or checked. No account-change listener is registered.

The address becomes the client-supplied `walletAddress` for both nonce and verification requests. The backend does not trust it by itself: successful verification additionally requires the recovered signing address to match it.

## 5. Nonce Generation

`AuthController.requestNonce(NonceRequest)` accepts a JSON object with `walletAddress`. `AuthServiceimpl.generateAndSaveNonce()` rejects blank addresses and creates a MongoDB `User` if that exact wallet string does not already exist. This user creation occurs before proof of wallet ownership, and this code does not assign a role during creation.

`NonceServiceImpl.generateAndSaveNonce()` creates 32 random bytes via `SecureRandom`, converts them to 64 lowercase hexadecimal characters without a `0x` prefix, and writes them to Redis using key `nonce:` + the wallet address and a five-minute TTL. A later nonce request for that same key replaces the earlier value. `getNonce()` returns null when absent/expired. The nonce is not stored in MongoDB or in an auth cookie; it is briefly returned to the browser in JSON and retained in the login component's React state as `message`.

## 6. Message Signing

The exact message is the nonce string as returned by the backend (64 lowercase hex characters, no prefix). The frontend converts this string's UTF-8 bytes to a `0x` hexadecimal string solely for the `personal_sign` RPC parameter. It invokes:

```text
window.ethereum.request({ method: 'personal_sign', params: [nonceHex, walletAddress] })
```

MetaMask returns a hexadecimal Ethereum signature, retained in the `signature` variable and posted to `/api/auth/verify`. `Web3SignatureUtil.recoverAddress()` uses `Sign.signedPrefixedMessageToKey`, documented in the code as MetaMask `personal_sign` / EIP-191. `signatureStringToData()` requires 65 bytes (`r` 32, `s` 32, `v` 1) and adjusts `v` by 27 when it is below 27.

No human-readable domain message, timestamp, chain ID, EIP-712 domain, or application origin is signed. Timestamped values occur on the JWT and Mongo user record, not in the signed challenge.

## 7. Backend Signature Verification

`AuthController.verify(VerifyRequest)` passes `walletAddress`, `message`, and `signature` to `AuthServiceimpl.verifyAndLogin()`.

Verification order in `AuthServiceimpl`:

1. Reject blank request fields.
2. Find the MongoDB user by the requested wallet address; otherwise throw `User not found`.
3. Read the Redis nonce associated with that requested address; otherwise throw `Nonce not found or expired`.
4. Require exact `message.equals(storedNonce)`.
5. Call `Web3SignatureUtil.recoverAddress(message, signature)`.
6. Require recovered address to equal requested wallet address, ignoring case.
7. Delete the nonce only after all checks succeed.

Replay resistance: the five-minute TTL limits nonce lifetime, and successful verification deletes the nonce. Failed verification does not delete it. A nonce can be overwritten by a newer nonce request for the same wallet. The Redis `get` and later `delete` are separate operations in this implementation; atomic single-use consumption is not implemented in these methods.

## 8. Token / Cookie / Session Creation

`JwtService.generateToken(walletAddress)` and `generateRefreshToken(walletAddress)` create HS256 JWTs with `sub` equal to the wallet address, `iat`, and `exp`. There are no other claims in the builder. No `userId` claim or token-type claim is added. Both use the same configured `jwt.secret`; the access and refresh expiration properties are in milliseconds (`jwt.expiration`, `jwt.refresh-expiration`). `AuthServiceimpl` returns a `role` string from the first stored role or the fallback `ROLE_USER`; that response value is not a JWT claim.

`AuthResponse` fields are `token`, `refreshToken`, `walletAddress`, `role`, `message`, and `expiresIn`. In `AuthServiceimpl`, `expiresIn` is set to `expiration / 1000` (seconds). `Front-end/app/api/auth/[action]/route.ts` treats it as milliseconds and divides by 1000 before assigning access-cookie `maxAge`. Therefore, for a configured JWT expiration of 86,400,000 ms, the access JWT lifetime is 24 hours while the access-cookie max age becomes 86 seconds. This is a units mismatch visible in these files.

The BFF sets:

| Cookie | HttpOnly | SameSite | Secure | Path | Lifetime |
|---|---:|---|---:|---|---|
| `aimarketplace_token` | Yes | `lax` | only when `NODE_ENV === 'production'` | `/` | `Math.floor(expiresIn / 1000)` seconds, or 86,400 seconds fallback |
| `aimarketplace_refresh_token` | Yes | `lax` | only in production | `/` | 30 days |
| `aimarketplace_wallet` | Yes | `lax` | only in production | `/` | same as access cookie |
| `aimarketplace_wallet_pub` | No | `lax` | only in production | `/` | same as access cookie |

The refresh cookie's 30-day browser lifetime is not tied to the backend refresh JWT expiration. The backend refresh JWT's lifetime is controlled by `JWT_REFRESH_EXPIRATION` through `jwt.refresh-expiration`. Actual JWT/cookie durations depend on environment configuration. `HttpOnly` prevents browser JavaScript from reading three cookies; `wallet_pub` is deliberately readable by JavaScript.

Spring Security is configured with `SessionCreationPolicy.STATELESS`; no server-side HTTP session is created. Cookies are created by the Next.js BFF, not Spring. Spring accepts bearer headers, not these cookies directly.

## 9. Subsequent Authenticated Requests

`Front-end/lib/api.ts` provides `withAuth()` and `serverFetch()`: they read `aimarketplace_token` on the server through `getToken()` and set `Authorization: Bearer <token>`. `bffFetch()` is a generic browser helper that sends same-origin cookies, but no current protected backend call through it was found. Browser JavaScript cannot read the HttpOnly access cookie.

The implemented upload path is:

```text
Front-end/app/upload/page.tsx
  → createModelUpload() in Front-end/lib/api/model-upload.ts
  → POST /api/upload/model-upload (same-origin Next.js BFF)
  → serverFetch('/api/v1/model-uploads') in Front-end/app/api/upload/model-upload/route.ts
  → Authorization: Bearer <access JWT>
  → Spring ModelUploadController if the URL maps to it
```

`server.servlet.context-path=/api` plus controller `@RequestMapping("/api/v1/model-uploads")` yields `/api/api/v1/model-uploads`; the BFF target uses `/api/v1/model-uploads`, so these paths do not align as configured. Also, the backend `CreateModelUploadRequest` contains only `fileName`, `fileSize`, and `contentType`; the frontend sends `modelName`, `description`, `category`, `price`, and the three file fields. Unknown JSON properties' handling is not configured here, and no actual upload/storage operation is implemented in the controller.

## 10. Spring Security Flow

`SecurityConfig.securityFilterChain()` enables CORS, disables CSRF, sets stateless sessions, permits `/auth/login`, `/auth/request-nonce`, `/auth/verify`, `/auth/refresh`, `/test/public`, `/test/health`, and `/health`, and requires authentication for every other request. `/auth/login` is permitted but no handler exists for it in `AuthController`.

`JwtAuthFilter.doFilterInternal()` reads only the `Authorization` header. If it starts with `Bearer `, the filter calls `JwtService.extractWalletAddress()`, which parses the signed JWS with the configured key and obtains the subject. Parsing validates the signature and standard expiration claim. The filter then looks up `UserRepository.findByWalletAddress()`. If present, it wraps the `User` in `UserPrincipal`, creates a `UsernamePasswordAuthenticationToken` with the principal's authorities, and sets that authentication in `SecurityContextHolder`. Invalid JWT parsing clears the context; absent headers leave the request unauthenticated. `anyRequest().authenticated()` then causes protected requests without authentication to be rejected.

The principal is `UserPrincipal`, whose `getUsername()` returns `user.getWalletAddress()`. Accordingly `Authentication.getName()` returns the wallet address. The authentication object stores the `UserPrincipal` as principal and roles as granted authorities. A controller can receive `Authentication auth` and use `auth.getName()`, as shown by `TestController.privateEndpoint()`. A controller/service can also cast `auth.getPrincipal()` to `UserPrincipal` and access `getUser()`. No controller currently demonstrates obtaining it via `@AuthenticationPrincipal` or directly from the context outside the test endpoint.

The filter does not call `JwtService.isValidToken()`; JWT signature and expiration are checked by `extractAllClaims()` parsing. The filter does not distinguish access and refresh JWTs: both have the same subject/claim format and use the same signing key, so a valid unexpired refresh JWT is also accepted by the bearer filter.

## 11. Frontend Route Protection

`Front-end/middleware.ts` defines `PROTECTED = ['/dashboard']`. A nonempty `aimarketplace_token` cookie allows `/dashboard`; otherwise it redirects to `/login?from=/dashboard` (or the requested descendant path). The middleware checks presence only; it does not verify JWT signature or expiry. `matcher` skips Next API routes, Next internals, and paths with a file extension.

For `/upload`, middleware does not guard it. The source comment explicitly says it is bypassed during development. A visitor can render the upload page without login; the subsequent BFF call forwards a token only if one is present, and Spring is expected to enforce backend authentication on a matched protected API route.

The login page's `readPublicWalletCookie()` redirects to the `from` value or `/dashboard` when `aimarketplace_wallet_pub` exists. This is a UI shortcut based on a client-readable cookie, not server validation of authentication.

There is no logout UI or logout API route found. `signOutResponse()` in `Front-end/lib/auth.ts` can clear the four cookies, but repository search found no caller. `tryRefreshToken()` exists but is not called; the BFF allows a `refresh` action, and the backend refresh endpoint is implemented.

## 12. Backend API Protection

Frontend route protection and backend API protection are distinct. Middleware only controls page navigation. Spring's `SecurityConfig` protects all non-permitted backend routes with `anyRequest().authenticated()`, and `JwtAuthFilter` establishes the identity from a bearer header.

`POST /api/v1/model-uploads` is the controller mapping before context path. With the configured context path it is externally `/api/api/v1/model-uploads`. If a request reaches this route without bearer authentication, Spring's `anyRequest().authenticated()` should reject it. If it reaches the controller with a valid bearer JWT, however, `ModelUploadController.createUpload()` does not accept `Authentication`, inspect `UserPrincipal`, call a service, or associate the upload with a wallet. Its method currently returns `ResponseEntity.ok(null)`.

The frontend upload BFF forwards authentication if the cookie exists, but does not itself reject missing tokens. The backend is the meaningful API security boundary when the URL is correctly routed. A mismatch in the path may instead mean the configured controller is never reached.

## 13. Authorization and Ownership

Role data exists: `User.roles` references `Role` documents; `ERole` defines `ROLE_USER`, `ROLE_ADMIN`, `ROLE_SUPER_ADMIN`, and `ROLE_MODERATOR`; `UserPrincipal.getAuthorities()` maps stored roles to authorities. The authentication response returns a role label or `ROLE_USER` fallback.

No endpoint-specific role rule (`hasRole`, `hasAuthority`, `@PreAuthorize`) was found. No model-upload ownership check or wallet-to-resource ownership check was found. The backend can answer who the request represents when the bearer filter succeeds (the wallet address in `Authentication.getName()`), but this repository does not implement authorization for whether that wallet may create or manage a particular model upload. The response fallback role does not create a role authority for users whose Mongo `roles` set is empty.

## 14. Authentication Endpoints

Backend URLs below include the configured `/api` servlet context path. The frontend BFF's `/api/auth/...` URLs are same-origin Next.js routes and forward to those backend endpoints.

| Endpoint | Method | Purpose | Authentication | Frontend Caller | Backend Handler |
|---|---|---|---|---|---|
| `/api/auth/request-nonce` | POST | Create/find user and issue/store nonce | Public (`permitAll`) | `Front-end/app/login/page.tsx` → `/api/auth/request-nonce` BFF | `AuthController.requestNonce(NonceRequest)` |
| `/api/auth/verify` | POST | Verify nonce signature and return JWTs | Public (`permitAll`) | `Front-end/app/login/page.tsx` → `/api/auth/verify` BFF | `AuthController.verify(VerifyRequest)` |
| `/api/auth/refresh` | POST | Accept refresh JWT and issue a new access JWT | Public (`permitAll`); refresh token is in JSON body | BFF action route; `tryRefreshToken()` also contains a direct caller but is unused | `AuthController.refreshToken()` |
| `/api/auth/login` | POST | Permitted by security rules, intended login mapping only | Public (`permitAll`) | No caller found | No handler found |
| `/api/api/v1/model-uploads` | POST | Create upload placeholder | Requires authenticated bearer request | Upload page → `/api/upload/model-upload` BFF, which targets backend `/api/v1/model-uploads` (mismatch noted above) | `ModelUploadController.createUpload(CreateModelUploadRequest)` |
| `/api/test/public` | GET | Public test endpoint | Public (`permitAll`) | No frontend caller found | `TestController.publicEndpoint()` |
| `/api/test/private` | GET | Demonstrate authenticated identity and authorities | Requires authenticated bearer request | No frontend caller found | `TestController.privateEndpoint(Authentication)` |
| `/api/test/health` | GET | Public test health endpoint | Public (`permitAll`) | No frontend caller found | `TestController.health()` |

No logout endpoint, current-user endpoint, or token revocation endpoint was found. `GET /health` is permitted by security but no matching handler was found in the inspected controller sources.

## 15. Request/Response Examples

Nonce request from frontend to BFF, forwarded unchanged to Spring:

```json
{ "walletAddress": "0x..." }
```

`NonceRequest` has the property `walletAddress`. `AuthController.requestNonce()` returns:

```json
{
  "nonce": "<64 lowercase hex characters>",
  "message": "Nonce generated successfully. Sign this nonce with your wallet."
}
```

Verification body uses `VerifyRequest` properties:

```json
{
  "walletAddress": "0x...",
  "message": "<exact nonce string>",
  "signature": "0x<65-byte signature encoded as hex>"
}
```

Successful response is `AuthResponse` with `token`, `refreshToken`, `walletAddress`, `role`, `message` (`Login successful`), and `expiresIn` (the service computes configured expiration divided by 1000). The BFF returns this response JSON and sets cookies when all three of token, refresh token, and wallet address are present.

Refresh request body is `{ "refreshToken": "<JWT>" }`. Successful refresh returns the same `AuthResponse` structure, with a newly generated access token and the same refresh token.

The frontend upload JSON has `modelName`, `description`, `category`, `price`, `fileName`, `fileSize`, and `contentType`. Backend `CreateModelUploadRequest` declares only `fileName`, `fileSize`, and `contentType`; the controller currently returns a null body with HTTP 200 if reached.

## 16. Authentication Data Flow

```text
MetaMask eth_requestAccounts
  → accounts[0] in login/page.tsx
  → { walletAddress } in POST /api/auth/request-nonce
  → NonceRequest.walletAddress
  → Mongo User lookup/create; Redis key nonce:<walletAddress>
  → nonce returned to browser
  → UTF-8 nonce encoded as 0x hex for personal_sign
  → MetaMask returns signature string (65 bytes as hex)
  → { walletAddress, message: nonce, signature } in POST /api/auth/verify
  → VerifyRequest fields
  → nonce equality + Web3SignatureUtil recovered address comparison
  → nonce deleted; JWTs generated with sub=walletAddress
  → AuthResponse { token, refreshToken, walletAddress, role, message, expiresIn }
  → Next BFF cookies: aimarketplace_token / aimarketplace_refresh_token / wallet cookies
  → serverFetch reads HttpOnly access cookie and sends Authorization: Bearer <token>
  → JwtAuthFilter extracts JWT subject, Mongo lookup by walletAddress
  → UserPrincipal(User), UsernamePasswordAuthenticationToken
  → SecurityContextHolder; Authentication.getName() = walletAddress
```

MongoDB persists the user and wallet address in the `users` collection (`User.walletAddress`, field `wallet_address`). Redis holds the temporary nonce. The JWT itself includes the wallet address as `sub`, but not `User.id`.

## 17. File-by-File Implementation Map

### Frontend

- `Front-end/app/login/page.tsx` — `connectWallet()` obtains the account, requests nonce, calls `personal_sign`, posts verification, and redirects; `readPublicWalletCookie()` implements the existing-login UI shortcut.
- `Front-end/middleware.ts` — checks access-cookie presence and guards `/dashboard` only.
- `Front-end/app/api/auth/[action]/route.ts` — `POST` BFF for `request-nonce`, `verify`, and `refresh`; forwards JSON and sets auth cookies from token responses.
- `Front-end/lib/auth.ts` — cookie constants; `getToken()`, `getWalletAddress()`, `isAuthenticated()`, `signOutResponse()`, and `tryRefreshToken()` helpers. The latter two are not called elsewhere in the repository.
- `Front-end/lib/api.ts` — `withAuth()` and `serverFetch()` add bearer tokens to server-side backend fetches; `bffFetch()` makes same-origin requests.
- `Front-end/app/api/upload/model-upload/route.ts` — validates upload metadata and forwards it with `serverFetch()`.
- `Front-end/lib/api/model-upload.ts` — `createModelUpload()` posts upload JSON to the BFF.
- `Front-end/app/upload/page.tsx` — collects form and local file metadata and calls `createModelUpload()`; it does not upload file bytes.
- `Front-end/app/dashboard/page.tsx` — reads the public wallet cookie for display; not the backend auth mechanism.
- `Front-end/.env.local` — contains `AIMARKETPLACE_API_URL` configuration; values intentionally not copied here.

### Backend

- `Backend/aimarketplace/src/main/java/com/aimarketplace/aimarketplace/config/SecurityConfig.java` — `securityFilterChain()` configures stateless Spring Security, public matchers, and `JwtAuthFilter` placement.
- `Backend/aimarketplace/src/main/java/com/aimarketplace/aimarketplace/config/CorsConfig.java` — allowed origins, methods, headers, and credentials.
- `Backend/aimarketplace/src/main/java/com/aimarketplace/aimarketplace/controller/AuthController.java` — `requestNonce()`, `verify()`, and `refreshToken()` endpoint methods.
- `Backend/aimarketplace/src/main/java/com/aimarketplace/aimarketplace/service/impl/AuthServiceimpl.java` — `generateAndSaveNonce()`, `verifyAndLogin()`, and `refreshToken()` business flow.
- `Backend/aimarketplace/src/main/java/com/aimarketplace/aimarketplace/service/impl/NonceServiceImpl.java` — random nonce generation, Redis lookup, five-minute TTL, and deletion.
- `Backend/aimarketplace/src/main/java/com/aimarketplace/aimarketplace/service/NonceService.java` — nonce service contract.
- `Backend/aimarketplace/src/main/java/com/aimarketplace/aimarketplace/security/jwt/Web3SignatureUtil.java` — signature hex parsing and EIP-191 address recovery.
- `Backend/aimarketplace/src/main/java/com/aimarketplace/aimarketplace/security/jwt/JwtService.java` — access/refresh JWT issue, parse, subject extraction, and refresh access-token issue.
- `Backend/aimarketplace/src/main/java/com/aimarketplace/aimarketplace/security/jwt/JwtAuthFilter.java` — bearer JWT parsing, Mongo user loading, and `SecurityContextHolder` authentication creation.
- `Backend/aimarketplace/src/main/java/com/aimarketplace/aimarketplace/security/UserPrincipal.java` — adapts `User` to Spring `UserDetails`; username is wallet address and authorities derive from stored roles.
- `Backend/aimarketplace/src/main/java/com/aimarketplace/aimarketplace/entity/User.java` — MongoDB `users` model with `walletAddress`, timestamps, and roles.
- `Backend/aimarketplace/src/main/java/com/aimarketplace/aimarketplace/entity/Role.java`, `enums/ERole.java`, and `repository/RoleRepository.java` — role persistence and role names.
- `Backend/aimarketplace/src/main/java/com/aimarketplace/aimarketplace/repository/UserRepository.java` — wallet address lookup and user persistence.
- `Backend/aimarketplace/src/main/java/com/aimarketplace/aimarketplace/controller/ModelUploadController.java` — protected upload placeholder; does not consume authentication identity.
- `Backend/aimarketplace/src/main/java/com/aimarketplace/aimarketplace/controller/TestController.java` — `privateEndpoint(Authentication)` demonstrates `Authentication.getName()` and authorities.
- `Backend/aimarketplace/src/main/java/com/aimarketplace/aimarketplace/dto/request/NonceRequest.java`, `VerifyRequest.java`, and `CreateModelUploadRequest.java` — actual request properties.
- `Backend/aimarketplace/src/main/java/com/aimarketplace/aimarketplace/dto/response/AuthResponse.java` — auth/refresh response properties.
- `Backend/aimarketplace/src/main/java/com/aimarketplace/aimarketplace/config/RedisConfig.java` — Redis string key/value serialization.
- `Backend/aimarketplace/src/main/resources/application.properties` — Mongo, Redis, context path, port, JWT and CORS environment-backed settings.
- `Backend/aimarketplace/pom.xml` — Spring Security, Redis, MongoDB, web3j, and JJWT dependencies.
- `Backend/aimarketplace/src/test/java/com/aimarketplace/aimarketplace/security/JwtServiceTest.java` — tests JWT generation and subject wallet extraction; no nonce/signature/filter/authorization test was found.

Other notes and planning docs exist, including `README.md`, `PRD.md`, and backend Markdown docs, but they do not replace the runtime source/configuration described above. No Docker configuration, `.env.example`, or authentication controller integration tests were found in the repository file scan. `Backend/aimarketplace/.env` supplies backend environment values locally; values are omitted here.

## 18. How to Access the Authenticated Wallet in Backend Code

When the request reaches a non-public controller route with a valid `Authorization: Bearer <access JWT>` header and a matching MongoDB user exists, the reliable Spring Security value is `Authentication.getName()`. `JwtAuthFilter` creates a `UsernamePasswordAuthenticationToken` with `UserPrincipal` as its principal; `UserPrincipal.getUsername()` returns `User.getWalletAddress()`.

Example of the existing pattern is `TestController.privateEndpoint(Authentication auth)`, which returns `auth.getName()`. A service can receive that value from a controller. Or code with the authenticated principal can cast it to `UserPrincipal` and call `getUser()`. The current `ModelUploadController.createUpload()` does neither, so no upload owner is currently recorded or checked. The wallet is not automatically injected into request DTOs.

## 19. Security Observations

### Implemented

- 32-byte `SecureRandom` nonce with a five-minute Redis TTL (`NonceServiceImpl`).
- Exact message/nonce match, EIP-191 prefixed signature recovery, case-insensitive recovered-address comparison, and nonce deletion after successful verification (`AuthServiceimpl`, `Web3SignatureUtil`).
- JWT signature and expiration parsing; wallet address is the JWT subject (`JwtService`).
- Stateless Spring Security and a bearer-token filter that loads the MongoDB user before constructing authentication (`SecurityConfig`, `JwtAuthFilter`).
- Access and refresh cookies are HttpOnly, SameSite `lax`, path `/`; Secure is enabled when Next.js `NODE_ENV` is production. The public display cookie contains only a wallet address.
- Configured CORS uses explicit localhost origins, allows common methods and all headers, and allows credentials (`CorsConfig`).

### Missing

- Nonce/message timestamps, chain ID, domain/origin binding, EIP-712 signing, a server-side session, a Spring-created cookie, a current-user endpoint, and a backend logout endpoint: **Not found in repository.**
- No domain/origin, timestamp, chain ID, or EIP-712 domain binding in the signed message.
- No nonce atomic consume operation: nonce read and deletion are separate service calls; a failed verification leaves it usable until expiry.
- No logout/revocation endpoint or refresh-token revocation store. The cookie-clearing helper has no caller.
- No current-user endpoint, endpoint-specific role policy, or model ownership check.
- No role assignment during the new-user path; returning a fallback `ROLE_USER` does not populate `UserPrincipal` authorities.
- No backend cookie parsing; backend auth requires a bearer header.
- No access-versus-refresh token type separation. Both are accepted by the bearer filter if unexpired and signed with the configured key.
- No nonce/signature/authentication integration tests found. `JwtServiceTest` tests token creation and subject extraction only.
- No upload file transfer or upload service implementation in `ModelUploadController`.

### Potential Risks

- **Nonce concurrency:** `getNonce()` and `deleteNonce()` are separate operations. Two concurrent verify requests may both read the same nonce before either deletes it. The code does not make consume-once atomic.
- **Address registration:** `generateAndSaveNonce()` creates a user before the wallet has proven ownership. This creates unverified user records but does not itself authenticate a request.
- **Refresh token accepted as bearer:** because token kind is not recorded or checked, a still-valid refresh JWT can be presented to protected APIs as a bearer token.
- **Cookie lifetime mismatch:** `AuthServiceimpl` returns seconds in `expiresIn`, but the BFF converts that value as milliseconds, so the access cookie may expire far earlier than its JWT.
- **Refresh cookie duration:** browser cookie is fixed at 30 days even when the refresh JWT may expire earlier; cookie presence alone does not prove refresh token validity.
- **Logout semantics:** `signOutResponse()` only clears browser cookies and is not wired to the UI. Even if called, it does not invalidate copied JWTs on the backend.
- **CSRF:** Spring disables CSRF. Current BFF-to-backend calls use an explicit bearer header, which is not automatically attached cross-site by a browser. The browser-facing BFF is same-origin and cookie-authenticated; no CSRF token/origin check is present on its upload handler, so cookie-driven cross-site invocation should be reviewed in the deployed browser/domain setup.
- **XSS:** HttpOnly protects the access and refresh values from direct JavaScript reads. `wallet_pub` is intentionally readable but is not a credential. HttpOnly does not prevent injected same-origin script from initiating requests that use cookies.
- **Frontend guards:** dashboard middleware trusts nonempty cookie presence and does not validate JWT. It is navigation behavior, not backend security. `/upload` is not guarded.
- **CORS:** the configured explicit origins are localhost development origins; production origin coverage is not established by this code. `allowCredentials(true)` means deployment should retain explicit trusted origins.
- **Logging:** `AuthController` and `AuthServiceimpl` print verify requests, nonce, signature, refresh token, and related auth values to standard output. This can expose sensitive challenge/token material in logs.
- **URL alignment:** the upload BFF target and Spring context path/controller mapping differ as described above, which can prevent the protected controller from being reached.

## 20. Known Limitations

- A connected wallet is not persisted in browser storage; the login state uses cookies. The access JWT is HttpOnly.
- The login challenge is a bare random nonce; it has no readable statement of the application, action, domain, timestamp, or chain.
- The `role` in the response may be a fallback string and does not guarantee the user has a stored role authority.
- `POST /api/v1/model-uploads` is only a placeholder and does not establish wallet ownership.
- `/upload` form accepts a local file but submits only metadata; the file bytes are not transferred.
- `api.ts` describes possible general helpers, but current route usage found only the upload BFF path; other protected API callers are not present in this repository.
- The listed auth API URL examples in docs do not override runtime endpoint composition from `application.properties` and controller mappings.

## 21. General Recommendations

These are recommendations, not existing behavior:

- Make nonce consumption atomic, bind a structured challenge to the expected application/domain and intended action, and include an issuance/expiry time and chain context where applicable.
- Add explicit access/refresh token typing and validate token type at each endpoint; align `expiresIn` units and cookie expiry with actual JWT expiration.
- Add a real logout/revocation or short-lived token strategy, and wire the UI to clear cookies.
- Protect all appropriate pages for usability, while retaining backend authentication as the enforcement layer.
- Align backend context path, controller mapping, and BFF target path; test the actual routed upload endpoint.
- Pass the authenticated principal wallet to upload services and enforce creator/owner rules there. Do not use a request-body wallet address as proof of identity.
- Add role assignment/provisioning and explicit endpoint authorization where roles are intended.
- Review CSRF protections for cookie-authenticated BFF routes, production CORS origins, authentication logging, and security integration tests.

**Assessment for `POST /api/v1/model-uploads`:** the intended bearer-token mechanism is present in the upload BFF path, and Spring's catch-all rule requires authentication if the request reaches the configured controller. The current implementation is not sufficient for secure wallet-owned uploads: the URL composition appears mismatched; the controller does not read `Authentication`/`UserPrincipal` or associate the request with a wallet; it has no service/ownership checks and currently returns `200` with a null body. A valid identity can be obtained in a controller as `Authentication.getName()`, but the upload controller does not currently use it.
