# Decentralized AI Model Marketplace

## Production Upload and Model Verification Workflow

**Selected storage provider:** Pinata + IPFS\
**Backend:** Spring Boot\
**Database:** MongoDB\
**Frontend:** Next.js\
**Optional on-chain layer:** Smart contract for
listing/ownership/payment records

------------------------------------------------------------------------

## 1. Storage decision

Use **Pinata with IPFS** for the initial implementation because this
project already uses an IPFS/CID workflow and Pinata was the previously
selected provider. Keep the storage integration behind a service
interface so the provider can be changed later without rewriting the
upload state machine.

-   Store model binaries in IPFS through Pinata.
-   Store the CID, uploader wallet, model metadata, verification status
    and listing data in MongoDB.
-   Do not store large model binaries in MongoDB.
-   Do not expose permanent Pinata credentials in the browser.
-   Check the current plan's storage, upload-size and
    retrieval/bandwidth limits before accepting large models.

**Filebase alternative:** Filebase supports both IPFS-backed buckets and
S3-compatible object storage. Its published free plan currently lists 5
GB shared storage and 10 GB IPFS egress, while bucket CID support is not
included in the free tier. IPFS bandwidth is distinct from
S3-object-storage egress. Check current pricing and limits before
choosing it for production.

------------------------------------------------------------------------

## 2. End-to-end workflow

### Step 1 --- User selects a model (Next.js)

The user selects a supported model file and enters listing metadata.

Frontend sends: - `fileName` - `fileSize` (declared, untrusted) -
`contentType` (declared, untrusted) - model metadata such as title,
description and price

The browser's filename, size and MIME type are hints, not proof.

### Step 2 --- Create an upload session (Spring Boot)

**Endpoint:** `POST /v1/model-uploads`

Backend: 1. Authenticates the user and obtains the wallet from the
authenticated principal. 2. Validates required fields, extension and
declared size. 3. Enforces the configured maximum upload size. 4.
Creates a MongoDB upload-session record. 5. Generates `uploadId` and
`expiresAt`. 6. Sets status to `PENDING`.

Response example:

``` json
{
  "uploadId": "upload_123",
  "status": "PENDING",
  "expiresAt": "2026-10-12T12:30:00Z"
}
```

### Step 3 --- Issue restricted upload authorization (Spring Boot)

**Suggested endpoint:**
`POST /v1/model-uploads/{uploadId}/upload-authorization`

Backend: 1. Confirms the session belongs to the authenticated wallet. 2.
Confirms the session has not expired and is in an allowed state. 3. Uses
a server-side Pinata credential to issue a provider-supported
restricted, short-lived upload authorization or signed upload request.
4. Restricts it to the intended upload and allowed limits as far as the
provider's API supports. 5. Changes status to `UPLOADING`.

The frontend receives only the temporary upload authorization---not the
permanent Pinata API secret.

### Step 4 --- Upload the file (Next.js → Pinata/IPFS)

The browser uploads the file directly to the provider using the
restricted authorization. This avoids proxying a multi-gigabyte file
through Spring Boot.

The provider returns a CID (and possibly an upload identifier/metadata).

The frontend must not be trusted to declare that the upload is verified.
A returned CID is only a reference to content.

### Step 5 --- Complete upload (Next.js → Spring Boot)

**Endpoint:** `POST /v1/model-uploads/{uploadId}/complete`

The frontend submits the CID and any provider upload identifier required
by the integration.

Backend: 1. Authenticates the request. 2. Checks session ownership and
expiry. 3. Checks that the state allows completion. 4. Queries Pinata
using server-side credentials to confirm the uploaded object exists and
correlates it with the intended upload/session using trusted metadata or
upload records. 5. Retrieves trusted provider metadata and actual size
where available. 6. Rejects missing, mismatched, expired or oversized
uploads. 7. Saves the CID and trusted metadata. 8. Sets status to
`UPLOADED`, then queues verification.

The CID supplied by the browser alone is not proof that this session
uploaded that content.

### Step 6 --- Verify actual content (verification worker)

**Suggested internal component:** `ModelVerificationService` or a
separate isolated Python worker.

The worker retrieves the content using a trusted CID/provider path and
applies resource limits. For large files, stream/download to a
size-limited temporary file rather than loading the entire model into
RAM.

#### 6A. Integrity and size

-   Enforce maximum bytes during retrieval, not only from declared
    metadata.
-   Compare provider-reported size with the session's allowed size.
-   Compute SHA-256 over the actual bytes if an integrity digest is
    required.
-   Compare against a trusted expected digest if one was recorded.
-   Do not assume an IPFS CID string is the same as a whole-file SHA-256
    digest; IPFS CIDs may identify chunked/DAG content.

#### 6B. Format validation

Use a validator appropriate to the actual format: - **ONNX:**
parse/check the ONNX model graph using the ONNX checker. Handle external
tensor data explicitly. - **Safetensors:** validate header, tensor
metadata, offsets and file bounds with the official library. - **PyTorch
`.pt` / `.pkl`:** treat as high risk. Do not unpickle or load arbitrary
files in the main backend. Prefer restricting these formats or
processing them only in a hardened sandbox.

A file extension or MIME type is not proof of valid format.

#### 6C. Optional runtime/security checks

If the marketplace promises that a model can run, perform a separate
isolated test with: - no network access by default; - strict CPU,
memory, disk and wall-clock limits; - unprivileged user and restricted
filesystem; - no access to application secrets; - cleanup of temporary
files.

Structural validity does not prove that a model is safe, accurate,
copyright-authorized or compatible with every inference environment.

### Step 7 --- Persist verification result (MongoDB)

If all required checks pass, save the verification result and set
`VERIFIED`. Otherwise set `REJECTED` with a safe, user-readable reason.
For asynchronous verification, return `202 Accepted` while the status is
`VERIFYING`; the frontend polls the status endpoint or receives an
event.

### Step 8 --- Publish listing

**Endpoint:** `POST /v1/models`

Only accept uploads in `VERIFIED` state. Re-check owner and state on the
server. Create the listing idempotently.

If required, submit a smart-contract transaction to record a CID/content
hash, ownership or sale terms. Blockchain registration is separate from
storing the binary and should not happen before the model passes the
required checks.

------------------------------------------------------------------------

## 3. API contract checklist

  -----------------------------------------------------------------------------------------------
  Method                  Endpoint                                        Purpose
  ----------------------- ----------------------------------------------- -----------------------
  POST                    `/v1/model-uploads`                             Create upload session

  POST                    `/v1/model-uploads/{id}/upload-authorization`   Issue restricted upload
                                                                          authorization

  POST                    `/v1/model-uploads/{id}/complete`               Confirm provider upload
                                                                          and queue verification

  GET                     `/v1/model-uploads/{id}`                        Return persisted status
                                                                          and safe details

  Internal                Verification worker interface                   Verify bytes and
                                                                          format; not publicly
                                                                          exposed

  POST                    `/v1/models`                                    Publish a verified
                                                                          model
  -----------------------------------------------------------------------------------------------

Adapt these routes to existing controller conventions; avoid creating
duplicate endpoints if equivalent ones already exist.

------------------------------------------------------------------------

## 4. Upload state machine

`PENDING → UPLOADING → UPLOADED → VERIFYING → VERIFIED`

Failure path: `VERIFYING → REJECTED`\
Expiry path: `PENDING/UPLOADING → EXPIRED`

Rules: - Only permit documented state transitions. - Check wallet
ownership and expiry on every session operation. - Make completion and
publishing idempotent. - Define retry behavior and clean up abandoned
provider uploads when possible. - Do not let the frontend set status
directly. - Avoid duplicate listings and duplicate on-chain
transactions.

------------------------------------------------------------------------

## 5. Suggested MongoDB fields

-   `uploadId`
-   `walletAddress`
-   `fileName`
-   `declaredSize`
-   `actualSize`
-   `contentType`
-   `cid`
-   `status`
-   `createdAt`
-   `updatedAt`
-   `expiresAt`
-   `verificationResult` (checks and results)
-   `sha256` (if computed)
-   `failureReason`
-   `listingId` (after publication)

Store metadata and verification outcomes in MongoDB---not the model
binary.

------------------------------------------------------------------------

## 6. Recommended implementation order

1.  Test the existing `POST /v1/model-uploads` session creation
    endpoint.
2.  Implement provider-specific upload authorization.
3.  Implement direct browser upload to Pinata.
4.  Implement completion with authenticated provider-side checks.
5.  Implement the verification worker for one format first (prefer
    ONNX).
6.  Persist status and expose `GET /v1/model-uploads/{id}`.
7.  Connect frontend progress/status polling and retry handling.
8.  Add Safetensors validation and isolated runtime tests if needed.
9.  Implement listing and optional smart-contract registration.
10. Add expiry cleanup, rate limits, logging, metrics and tests.

**MVP recommendation:** Start with ONNX and Safetensors. Avoid arbitrary
`.pkl` loading. Keep the verification worker isolated from the Spring
Boot process.

------------------------------------------------------------------------

## 7. Acceptance criteria

-   An unauthenticated user cannot create or complete a session.
-   One wallet cannot access another wallet's upload session.
-   An expired session cannot be completed.
-   A fabricated CID alone cannot pass completion.
-   Actual size is checked against the configured limit.
-   Invalid or malformed model files are rejected.
-   Untrusted model code is never executed in the main backend.
-   Failed verification stores a reason and never permits publication.
-   Repeated completion/publish requests do not create duplicate
    listings.
-   Only `VERIFIED` models can be published.
