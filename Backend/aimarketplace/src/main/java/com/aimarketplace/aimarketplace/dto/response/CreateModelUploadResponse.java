package com.aimarketplace.aimarketplace.dto.response;

import lombok.Data;

import java.time.Instant;

@Data
public class CreateModelUploadResponse {

    private String uploadId;

    private String status;

    private Instant expiresAt;
}