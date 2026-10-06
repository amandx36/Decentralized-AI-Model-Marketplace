package com.aimarketplace.aimarketplace.controller;

import com.aimarketplace.aimarketplace.dto.request.CreateModelUploadRequest;
import com.aimarketplace.aimarketplace.dto.response.CreateModelUploadResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/model-uploads")
public class ModelUploadController {

    @PostMapping
    public ResponseEntity<CreateModelUploadResponse> createUpload(
            @RequestBody CreateModelUploadRequest request
    ) {

        // service call will come here

        return ResponseEntity.ok(null);
    }
}