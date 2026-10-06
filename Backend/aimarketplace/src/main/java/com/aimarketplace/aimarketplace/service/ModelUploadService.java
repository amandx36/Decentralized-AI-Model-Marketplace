package com.aimarketplace.aimarketplace.service;
import com.aimarketplace.aimarketplace.dto.response.*;
import com.aimarketplace.aimarketplace.dto.request.*;
public interface ModelUploadService {
    CreateModelUploadResponse createUpload(CreateModelUploadRequest request, String walletAddress);
    void validate(CreateModelUploadRequest request, String walletAddress);
}
