package com.aimarketplace.aimarketplace.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/test")
public class TestController {

    @GetMapping("/public")
    public ResponseEntity<?> publicEndpoint() {
        return ResponseEntity.ok(Map.of(
            "message", "This is a public endpoint - no authentication required",
            "timestamp", System.currentTimeMillis()
        ));
    }

    @GetMapping("/private")
    public ResponseEntity<?> privateEndpoint(Authentication auth) {
        return ResponseEntity.ok(Map.of(
            "message", "This is a private endpoint - JWT required",
            "authenticated_user", auth.getName(),
            "authorities", auth.getAuthorities(),
            "timestamp", System.currentTimeMillis()
        ));
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "AI-Marketplace-Backend",
            "timestamp", System.currentTimeMillis()
        ));
    }
}
