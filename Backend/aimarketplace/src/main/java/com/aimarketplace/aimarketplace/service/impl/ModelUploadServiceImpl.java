package com.aimarketplace.aimarketplace.service.impl;

import com.aimarketplace.aimarketplace.dto.request.CreateModelUploadRequest;
import com.aimarketplace.aimarketplace.dto.request.CompleteModelUploadRequest;
import com.aimarketplace.aimarketplace.dto.response.CreateModelUploadResponse;
import com.aimarketplace.aimarketplace.dto.response.CreateUploadAuthorizationResponse;
import com.aimarketplace.aimarketplace.entity.ModelUpload;
import com.aimarketplace.aimarketplace.exception.PayloadTooLargeException;
import com.aimarketplace.aimarketplace.repository.ModelUploadRepository;
import com.aimarketplace.aimarketplace.service.ModelUploadService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.List;
import java.util.UUID;

@Service
public class ModelUploadServiceImpl implements ModelUploadService {

    private static final Logger logger = LoggerFactory.getLogger(ModelUploadServiceImpl.class);

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".onnx", ".pt", ".pkl", ".safetensors");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/octet-stream", "application/onnx", "application/x-pytorch",
            "application/x-pickle", "application/python-pickle", "application/x-safetensors"
    );

    private final ModelUploadRepository modelUploadRepository;
    private final long maximumFileSizeBytes;
    private final long sessionLifetimeMinutes;
    private final long authorizationLifetimeSeconds;
    private final String pinataJwt;
    private static final String PINATA_SIGN_URL = "https://uploads.pinata.cloud/v3/files/sign";
    private final RestTemplate restTemplate = new RestTemplate();

    public ModelUploadServiceImpl(ModelUploadRepository modelUploadRepository,
                              @Value("${model-upload.max-file-size-bytes:5368709120}") long maximumFileSizeBytes,
                              @Value("${model-upload.session-lifetime-minutes:15}") long sessionLifetimeMinutes,
                              @Value("${model-upload.authorization-lifetime-seconds:300}") long authorizationLifetimeSeconds,
                              @Value("${pinata.jwt:}") String pinataJwt) {
        this.modelUploadRepository = modelUploadRepository;
        this.maximumFileSizeBytes = maximumFileSizeBytes;
        this.sessionLifetimeMinutes = sessionLifetimeMinutes;
        this.authorizationLifetimeSeconds = authorizationLifetimeSeconds;
        this.pinataJwt = pinataJwt;
    }

    @Override
    public CreateModelUploadResponse createUpload(CreateModelUploadRequest request, String walletAddress) {
        validate(request, walletAddress);
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(sessionLifetimeMinutes * 60);
        ModelUpload upload = new ModelUpload();
        upload.setUploadId(UUID.randomUUID().toString());
        upload.setWalletAddress(walletAddress);
        upload.setFileName(request.getFileName().trim());
        upload.setFileSize(request.getFileSize());
        upload.setContentType(request.getContentType().trim().toLowerCase(Locale.ROOT));
        upload.setStatus("PENDING");
        upload.setCreatedAt(now);
        upload.setExpiresAt(expiresAt);
        ModelUpload saved = upload;
        saved.setModelName(request.getModelName().trim());
        saved.setDescription(request.getDescription().trim());
        saved.setCategory(request.getCategory().trim());
        saved.setPrice(request.getPrice());
        saved = modelUploadRepository.save(saved);

        CreateModelUploadResponse response = new CreateModelUploadResponse();
        response.setUploadId(saved.getUploadId());
        response.setStatus(saved.getStatus());
        response.setExpiresAt(saved.getExpiresAt());
        return response;
    }

    @Override
    public void validate(CreateModelUploadRequest request, String walletAddress) {
        if (walletAddress == null || walletAddress.isBlank()) {
            throw new IllegalArgumentException("Authenticated wallet is required");
        }
        if (request == null) {
            throw new IllegalArgumentException("Request body is required");
        }
        if (request.getModelName() == null || request.getModelName().isBlank() ||
                request.getDescription() == null || request.getDescription().isBlank() ||
                request.getCategory() == null || request.getCategory().isBlank() ||
                request.getPrice() == null || !Double.isFinite(request.getPrice()) || request.getPrice() < 0) {
            throw new IllegalArgumentException("Model name, description, category, and a non-negative price are required");
        }
        String fileName = request.getFileName();
        if (fileName == null || fileName.isBlank()) {
            throw new IllegalArgumentException("fileName is required");
        }
        if (fileName.trim().length() > 255) {
            throw new IllegalArgumentException("fileName must be 255 characters or fewer");
        }
        String lowerFileName = fileName.trim().toLowerCase(Locale.ROOT);
        if (ALLOWED_EXTENSIONS.stream().noneMatch(lowerFileName::endsWith)) {
            throw new IllegalArgumentException("fileName must end with .onnx, .pt, .pkl, or .safetensors");
        }
        if (request.getFileSize() == null || request.getFileSize() <= 0) {
            throw new IllegalArgumentException("fileSize must be greater than zero");
        }
        if (request.getFileSize() > maximumFileSizeBytes) {
            throw new PayloadTooLargeException("fileSize exceeds the maximum allowed upload size");
        }
        String contentType = request.getContentType();
        if (contentType == null || contentType.isBlank()) {
            throw new IllegalArgumentException("contentType is required");
        }
        if (!ALLOWED_CONTENT_TYPES.contains(contentType.trim().toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("contentType is not an allowed model content type");
        }
    }

    @Override
    public CreateUploadAuthorizationResponse createUploadAuthorization(String uploadId, String walletAddress) {
        if (uploadId == null || uploadId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "uploadId is required");
        }
        if (walletAddress == null || walletAddress.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated wallet is required");
        }

        ModelUpload saved = modelUploadRepository.findById(uploadId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Upload session not found"));

        if (saved.getWalletAddress() == null ||
                !saved.getWalletAddress().trim().equalsIgnoreCase(walletAddress.trim())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This upload does not belong to the authenticated wallet");
        }

        Instant now = Instant.now();
        if (saved.getExpiresAt() == null || !saved.getExpiresAt().isAfter(now)) {
            throw new ResponseStatusException(HttpStatus.GONE, "Upload session has expired");
        }

        if (!"PENDING".equalsIgnoreCase(saved.getStatus()) && !"UPLOADING".equalsIgnoreCase(saved.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Upload session is not in an uploadable state");
        }

        if (pinataJwt == null || pinataJwt.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Pinata authorization is not configured");
        }

        long secondsUntilSessionExpires = Duration.between(now, saved.getExpiresAt()).getSeconds();
        long signedUrlLifetimeSeconds = Math.min(authorizationLifetimeSeconds, secondsUntilSessionExpires);
        if (signedUrlLifetimeSeconds <= 0) {
            throw new ResponseStatusException(HttpStatus.GONE, "Upload session has expired");
        }

        String uploadUrl = createPinataSignedUrl(saved, now, signedUrlLifetimeSeconds);

        // Change state only after Pinata successfully creates the signed URL.
        saved.setStatus("UPLOADING");
        modelUploadRepository.save(saved);

        CreateUploadAuthorizationResponse response = new CreateUploadAuthorizationResponse();
        response.setStatus(saved.getStatus());
        response.setUploadUrl(uploadUrl);
        response.setExpiresAt(now.plusSeconds(signedUrlLifetimeSeconds));
        return response;
    }

    @Override
    public CreateModelUploadResponse completeUpload(String uploadId, CompleteModelUploadRequest request, String walletAddress) {
        if (request == null || request.getCid() == null || request.getCid().isBlank() ||
                request.getFileId() == null || request.getFileId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pinata file ID and CID are required");
        }
        ModelUpload upload = modelUploadRepository.findById(uploadId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Upload session not found"));
        if (upload.getWalletAddress() == null || !upload.getWalletAddress().equalsIgnoreCase(walletAddress)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This upload does not belong to the authenticated wallet");
        }
        if ("UPLOADED".equalsIgnoreCase(upload.getStatus())) {
            if (request.getCid().equals(upload.getCid()) && request.getFileId().equals(upload.getPinataFileId())) {
                return uploadResponse(upload);
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Upload session was already completed with different content");
        }
        if (!"UPLOADING".equalsIgnoreCase(upload.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Upload session is not in UPLOADING state");
        }
        if (upload.getExpiresAt() == null || !upload.getExpiresAt().isAfter(Instant.now())) {
            upload.setStatus("EXPIRED");
            modelUploadRepository.save(upload);
            throw new ResponseStatusException(HttpStatus.GONE, "Upload session has expired");
        }
        if (pinataJwt == null || pinataJwt.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Pinata authorization is not configured");
        }

        Map<String, Object> fileData = fetchPinataFile(request.getFileId());
        Object verifiedCid = fileData.get("cid");
        Object verifiedSize = fileData.get("size");
        Object keyvalues = fileData.get("keyvalues");
        Object associatedUpload = keyvalues instanceof Map<?, ?> values ? values.get("uploadId") : null;
        if (!(verifiedCid instanceof String) || !request.getCid().equals(verifiedCid) ||
                !(verifiedSize instanceof Number) || ((Number) verifiedSize).longValue() != upload.getFileSize() ||
                (request.getActualSize() != null && request.getActualSize().longValue() != ((Number) verifiedSize).longValue()) ||
                !upload.getUploadId().equals(associatedUpload)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Uploaded file does not match this upload session");
        }

        upload.setCid((String) verifiedCid);
        upload.setPinataFileId(request.getFileId());
        upload.setActualSize(((Number) verifiedSize).longValue());
        upload.setStatus("UPLOADED");
        return uploadResponse(modelUploadRepository.save(upload));
    }

    private Map<String, Object> fetchPinataFile(String fileId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(pinataJwt);
        for (String network : List.of("public", "private")) {
            try {
                ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                        "https://api.pinata.cloud/v3/files/" + network + "/" +
                                java.net.URLEncoder.encode(fileId, java.nio.charset.StandardCharsets.UTF_8),
                        HttpMethod.GET, new HttpEntity<>(headers), new ParameterizedTypeReference<Map<String, Object>>() { });
                Object data = response.getBody() == null ? null : response.getBody().get("data");
                if (data instanceof Map<?, ?> map) {
                    @SuppressWarnings("unchecked") Map<String, Object> typed = (Map<String, Object>) map;
                    return typed;
                }
            } catch (RestClientException ignored) {
                // The signed upload may have been created for either Pinata network.
            }
        }
        throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Pinata could not confirm the uploaded file");
    }

    private CreateModelUploadResponse uploadResponse(ModelUpload upload) {
        CreateModelUploadResponse response = new CreateModelUploadResponse();
        response.setUploadId(upload.getUploadId());
        response.setStatus(upload.getStatus());
        response.setExpiresAt(upload.getExpiresAt());
        return response;
    }

    private String createPinataSignedUrl(ModelUpload upload, Instant now, long lifetimeSeconds) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(Objects.requireNonNull(pinataJwt));
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = Map.of(
                "date", now.getEpochSecond(),
                "expires", lifetimeSeconds,
                "max_file_size", upload.getFileSize(),
                "filename", upload.getFileName(),
                "keyvalues", Map.of("uploadId", upload.getUploadId())
        );

        try {
                    ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    PINATA_SIGN_URL,
                    HttpMethod.POST,
                    new HttpEntity<>(requestBody, headers),
                    new ParameterizedTypeReference<Map<String, Object>>() { }
            );
                    Map<String, Object> responseBody = response.getBody();
                    if (responseBody == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Pinata returned an invalid upload authorization");
                    }
                    Object data = responseBody.get("data");
            if (!(data instanceof String)) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Pinata returned an invalid upload authorization");
            }

            String signedUrl = (String) data;
            java.net.URI uri = java.net.URI.create(signedUrl);
            if (!"https".equalsIgnoreCase(uri.getScheme()) ||
                    !"uploads.pinata.cloud".equalsIgnoreCase(uri.getHost())) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Pinata returned an invalid upload authorization");
            }
            return signedUrl;
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (RestClientResponseException exception) {
            // Pinata's response body often explains whether the JWT, permissions, or
            // request parameters were rejected. Keep it in server logs, never expose
            // it to the browser where provider details may contain sensitive data.
            String providerMessage = exception.getResponseBodyAsString();
            if (providerMessage.length() > 1000) {
                providerMessage = providerMessage.substring(0, 1000);
            }
            logger.error("Pinata upload authorization failed: HTTP {}. Response: {}",
                    exception.getRawStatusCode(), providerMessage);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Pinata rejected upload authorization (HTTP " + exception.getRawStatusCode() +
                            "). Check that PINATA_JWT is valid and has org:files:write permission.");
        } catch (RestClientException | IllegalArgumentException exception) {
            logger.error("Could not reach Pinata to create upload authorization: {}",
                    exception.getMessage(), exception);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not create Pinata upload authorization");
        }
    }
}
