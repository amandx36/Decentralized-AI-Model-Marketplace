package com.aimarketplace.aimarketplace.controller;

import com.aimarketplace.aimarketplace.dto.request.CompleteModelUploadRequest;
import com.aimarketplace.aimarketplace.dto.request.CreateModelUploadRequest;
import com.aimarketplace.aimarketplace.dto.response.CreateModelUploadResponse;
import com.aimarketplace.aimarketplace.dto.response.CreateUploadAuthorizationResponse;
import com.aimarketplace.aimarketplace.security.UserPrincipal;
import com.aimarketplace.aimarketplace.service.ModelUploadService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/model-uploads")
// calls when the user first upload the model and verifies it and send to front end part 1
public class ModelUploadController {

    private final ModelUploadService modelUploadService;

    public ModelUploadController(ModelUploadService modelUploadService) {
        this.modelUploadService = modelUploadService;
    }

    @PostMapping
    public ResponseEntity<CreateModelUploadResponse> createUpload(
        @RequestBody CreateModelUploadRequest request,
        Authentication authentication
    ) {
        if (
            authentication == null ||
            !authentication.isAuthenticated() ||
            !(authentication.getPrincipal() instanceof UserPrincipal)
        ) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String walletAddress = principal.getUser().getWalletAddress();

        CreateModelUploadResponse response = modelUploadService.createUpload(
            request,
            walletAddress
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{uploadId}/upload-authorization")
    public ResponseEntity<CreateUploadAuthorizationResponse> createUploadAuthorization(
        @PathVariable String uploadId,
        Authentication authentication
    ) {
        System.out.println("Model upload point 2 ");
        if (
            authentication == null ||
            !authentication.isAuthenticated() ||
            !(authentication.getPrincipal() instanceof UserPrincipal)
        ) {
            System.out.println("model upload point 3");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String walletAddress = principal.getUser().getWalletAddress();
        System.out.println("Uploading the model point 4");
        return ResponseEntity.ok(
            modelUploadService.createUploadAuthorization(
                uploadId,
                walletAddress
            )
        );
    }

    @PostMapping("/{uploadId}/complete")
    public ResponseEntity<CreateModelUploadResponse> completeUpload(
        @PathVariable String uploadId,
        @RequestBody CompleteModelUploadRequest request,
        Authentication authentication
    ) {
        if (
            authentication == null ||
            !authentication.isAuthenticated() ||
            !(authentication.getPrincipal() instanceof UserPrincipal)
        ) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String walletAddress = principal.getUser().getWalletAddress();
        return ResponseEntity.ok(
            modelUploadService.completeUpload(uploadId, request, walletAddress)
        );
    }
}
