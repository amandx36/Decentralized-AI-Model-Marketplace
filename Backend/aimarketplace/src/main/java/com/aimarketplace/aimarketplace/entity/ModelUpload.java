package com.aimarketplace.aimarketplace.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
@Getter
@Setter
@NoArgsConstructor 
@AllArgsConstructor 
@Document(collection = "model_uploads")
public class ModelUpload {

    @Id
    private String uploadId;

    private String walletAddress;
    private String fileName;
    private Long fileSize;
    private String contentType;
    private String status;
    private Instant createdAt;
    private Instant expiresAt;
}