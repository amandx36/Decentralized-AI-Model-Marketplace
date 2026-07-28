package com.aimarketplace.aimarketplace.controller;


import com.aimarketplace.aimarketplace.dto.request.LoginRequest;
import com.aimarketplace.aimarketplace.dto.request.NonceRequest;
import com.aimarketplace.aimarketplace.dto.request.VerifyRequest;
import com.aimarketplace.aimarketplace.dto.response.AuthResponse;
import com.aimarketplace.aimarketplace.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/request-nonce")
    public ResponseEntity<?> requestNonce(@RequestBody NonceRequest request) {
        String nonce = authService.generateAndSaveNonce(request.getWalletAddress());
        return ResponseEntity.ok(Map.of(
            "nonce", nonce,
            "message", "Nonce generated successfully. Sign this nonce with your wallet."
        ));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody VerifyRequest request) {
        AuthResponse response = authService.verifyAndLogin(
            request.getWalletAddress(),
            request.getMessage(),
            request.getSignature()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        if (refreshToken == null || refreshToken.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "refreshToken is required"
            ));
        }
        AuthResponse response = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(response);
    }
}

