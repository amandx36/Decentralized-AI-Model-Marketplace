package com.aimarketplace.aimarketplace.service.impl;

import com.aimarketplace.aimarketplace.service.*;
import com.aimarketplace.aimarketplace.dto.request.CreateModelUploadRequest;
import com.aimarketplace.aimarketplace.dto.response.CreateModelUploadResponse;
import com.aimarketplace.aimarketplace.entity.ModelUpload;
import com.aimarketplace.aimarketplace.exception.PayloadTooLargeException;
import com.aimarketplace.aimarketplace.repository.ModelUploadRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class ModelUploadServiceImpl implements ModelUploadService  {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".onnx", ".pt", ".pkl", ".safetensors");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/octet-stream", "application/onnx", "application/x-pytorch",
            "application/x-pickle", "application/python-pickle", "application/x-safetensors"
    );

    private final ModelUploadRepository modelUploadRepository;
    private final long maximumFileSizeBytes;
    private final long sessionLifetimeMinutes;
    
    public ModelUploadServiceImpl(ModelUploadRepository modelUploadRepository,
                              @Value("${model-upload.max-file-size-bytes:5368709120}") long maximumFileSizeBytes,
                              @Value("${model-upload.session-lifetime-minutes:15}") long sessionLifetimeMinutes) {
        this.modelUploadRepository = modelUploadRepository;
        this.maximumFileSizeBytes = maximumFileSizeBytes;
        this.sessionLifetimeMinutes = sessionLifetimeMinutes;
    }

    @Override
    public CreateModelUploadResponse createUpload(CreateModelUploadRequest request, String walletAddress) {
        validate(request, walletAddress);

        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(sessionLifetimeMinutes * 60);
        ModelUpload saved = modelUploadRepository.save(new ModelUpload(
                UUID.randomUUID().toString(), walletAddress, request.getFileName().trim(),
                request.getFileSize(), request.getContentType().trim().toLowerCase(Locale.ROOT),
                "PENDING", now, expiresAt
        ));

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
}
