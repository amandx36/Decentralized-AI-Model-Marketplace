package com.aimarketplace.aimarketplace.dto.response;

import java.time.Instant;

public class CreateUploadAuthorizationResponse  {
    private String status;

    private String uploadUrl;

    private Instant expiresAt;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getUploadUrl() {
        return uploadUrl;
    }

    public void setUploadUrl(String uploadUrl) {
        this.uploadUrl = uploadUrl;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }
}
