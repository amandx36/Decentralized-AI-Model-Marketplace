package com.aimarketplace.aimarketplace.dto.request;

import lombok.Data;

@Data
public class CreateModelUploadRequest {

    private String fileName;

    private Long fileSize;

    private String contentType;
}