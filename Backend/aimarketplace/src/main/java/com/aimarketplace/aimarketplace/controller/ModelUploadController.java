package com.aimarketplace.aimarketplace.controller;

import com.aimarketplace.aimarketplace.dto.request.CreateModelUploadRequest;
import com.aimarketplace.aimarketplace.dto.response.CreateModelUploadResponse;
import com.aimarketplace.aimarketplace.security.UserPrincipal;
import com.aimarketplace.aimarketplace.service.impl.ModelUploadServiceImpl;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/model-uploads")
public class ModelUploadController {

    private final ModelUploadServiceImpl modelUploadService;

    public ModelUploadController(ModelUploadServiceImpl modelUploadService) {
        this.modelUploadService = modelUploadService;
        System.out.println("ModelUploadController initialized with ModelUploadServiceImpl");
    }
    
@PostMapping
public ResponseEntity<CreateModelUploadResponse> createUpload(
        @RequestBody CreateModelUploadRequest request,
        Authentication authentication
) {
        System.out.println("Reached to the create upload controller method");
    if (authentication == null ||
            !authentication.isAuthenticated() ||
            !(authentication.getPrincipal() instanceof UserPrincipal)) {

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    UserPrincipal principal =
            (UserPrincipal) authentication.getPrincipal();

    String walletAddress =
            principal.getUser().getWalletAddress();

    CreateModelUploadResponse response =
            modelUploadService.createUpload(request, walletAddress);

    System.out.println("Model upload created successfully");
    return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(response);
}
}
