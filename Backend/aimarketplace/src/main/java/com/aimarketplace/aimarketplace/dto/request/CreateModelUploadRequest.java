package com.aimarketplace.aimarketplace.dto.request;

import lombok.Data;

@Data
public class CreateModelUploadRequest {

    private String fileName;

    private Long fileSize;

    private String contentType;
    private String modelName;
    private String description;
    private String category;
    private Double price;
}
