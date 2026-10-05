# =========================================================
# AI MODEL UPLOAD FLOW   LLD of upload model 
# Next.js + Spring Boot + Pinata/IPFS + MongoDB + Ethereum
# =========================================================


USER
  |
  | 1. Selects model
  |    Example: model.safetensors (4 GB)
  v
NEXT.JS FRONTEND
  |
  | 2. Send file METADATA only
  |    POST /api/v1/model-uploads
  |
  |    {
  |      fileName,
  |      fileSize,
  |      contentType
  |    }
  v
SPRING BOOT BACKEND
  |
  | 3. Authenticate user
  | 4. Authorize user
  | 5. Validate metadata
  |    - file size
  |    - allowed extension
  |    - upload limits
  |
  | 6. Create upload session
  | 7. Generate short-lived upload authorization
  |
  v
MONGODB
  |
  | 8. Store upload session
  |
  |    uploadId
  |    userId
  |    fileName
  |    fileSize
  |    status = CREATED
  |    expiresAt
  |
  v
SPRING BOOT
  |
  | 9. Return upload authorization
  v
NEXT.JS FRONTEND
  |
  | 10. Upload ACTUAL 4 GB FILE
  |     directly to Pinata
  |
  |     Chunked / Resumable Upload
  |
  |     Spring Boot does NOT receive
  |     the 4 GB file.
  v
PINATA / IPFS
  |
  | 11. Store / pin model
  |
  | 12. Generate CID
  |
  v
NEXT.JS FRONTEND
  |
  | 13. Upload completed
  |
  | POST /api/v1/model-uploads/{id}/complete
  |     providerUploadId / upload information
  v
SPRING BOOT
  |
  | 14. Verify:
  |     - user owns upload
  |     - upload not expired
  |     - upload exists
  |     - uploaded size
  |     - CID
  |     - upload status
  |
  v
MONGODB
  |
  | 15. Update upload
  |
  |     status = UPLOADED
  |     cid = bafy...
  |
  v
SPRING BOOT
  |
  | 16. Security / Model Verification
  |
  | POST /api/v1/model-uploads/{id}/verify
  |
  | Check:
  |     - ownership
  |     - file signature/type
  |     - allowed model format
  |     - file size
  |     - security/malware scan
  |     - model validation
  |
  v
MONGODB
  |
  | 17. Update:
  |
  |     VERIFIED
  |
  | OR
  |
  |     REJECTED
  |
  v
NEXT.JS
  |
  | 18. User enters:
  |     - Model name
  |     - Description
  |     - Category
  |     - Price
  |
  | POST /api/v1/models
  v
SPRING BOOT
  |
  | 19. Verify:
  |     - upload belongs to user
  |     - upload is VERIFIED
  |     - CID exists
  |
  | 20. Create marketplace model
  v
MONGODB
  |
  | 21. Store metadata
  |
  |     modelId
  |     ownerId
  |     uploadId
  |     name
  |     description
  |     category
  |     price
  |     cid
  |     status = DRAFT
  |
  v
NEXT.JS
  |
  | 22. User clicks Publish
  |
  | POST /api/v1/models/{id}/publish
  v
SPRING BOOT
  |
  | 23. Verify:
  |     - authenticated user
  |     - model ownership
  |     - model status = VERIFIED/DRAFT
  |     - valid price
  |
  | 24. Prepare blockchain transaction
  v
NEXT.JS
  |
  | 25. Send transaction to wallet
  v
METAMASK / USER WALLET
  |
  | 26. User signs transaction
  v
ETHEREUM SMART CONTRACT
  |
  | 27. Store on-chain information
  |
  |     modelId
  |     owner
  |     price
  |     CID/reference
  |
  v
BLOCKCHAIN
  |
  | 28. Transaction confirmed
  v
NEXT.JS
  |
  | 29. Get transactionHash
  |
  | POST /api/v1/models/{id}/publish/confirm
  |     {
  |       transactionHash
  |     }
  v
SPRING BOOT
  |
  | 30. Verify blockchain transaction
  |     - transaction exists
  |     - transaction succeeded
  |     - correct contract
  |     - correct model
  |     - correct owner
  |
  v
MONGODB
  |
  | 31. Update model
  |
  |     status = PUBLISHED
  |     transactionHash = 0x...
  |
  v
FINAL
  |
  +---- Pinata/IPFS
  |       |
  |       └── Actual 4 GB model
  |
  +---- MongoDB
  |       |
  |       └── Metadata + application state
  |
  +---- Ethereum
          |
          └── Ownership + on-chain marketplace state




1. POST /api/v1/model-uploads
        ↓
   CREATE UPLOAD SESSION

2. DIRECT UPLOAD
   Next.js ─────────────► Pinata
   Actual GB file

3. POST /api/v1/model-uploads/{id}/complete
        ↓
   UPLOAD COMPLETE

4. POST /api/v1/model-uploads/{id}/verify
        ↓
   SECURITY + MODEL VERIFICATION

5. POST /api/v1/models
        ↓
   CREATE MARKETPLACE MODEL

6. POST /api/v1/models/{id}/publish
        ↓
   PREPARE BLOCKCHAIN TRANSACTION

7. USER WALLET
        ↓
   SIGN TRANSACTION

8. POST /api/v1/models/{id}/publish/confirm
        ↓
   VERIFY BLOCKCHAIN TRANSACTION

9. MongoDB
        ↓
   status = PUBLISHED
