package com.aimarketplace.aimarketplace.controller;


import com.aimarketplace.aimarketplace.dto.request.LoginRequest;
import com.aimarketplace.aimarketplace.dto.request.NonceRequest;
import com.aimarketplace.aimarketplace.dto.request.VerifyRequest;
import com.aimarketplace.aimarketplace.dto.response.LoginResponse;
import com.aimarketplace.aimarketplace.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.RequestEntity;
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

    // method for request nonce

    @PostMapping("/request-nonce")
    public ResponseEntity<?> requestNonce(@RequestBody NonceRequest request){
        String nonce = authService.generateAndSaveNonce(request.getWalletAddress());
        return ResponseEntity.ok(Map.of("nonce", nonce));
    }
    // verify nonce
    @PostMapping("/verify")
    public  ResponseEntity<?> verify(@RequestBody  VerifyRequest request){
        String token = authService.verifyAndLogin(

                request.getWalletAddress(),
                request.getMessage(),
                request.getSignature()
        );

        return ResponseEntity.ok(Map.of("token", token));

    }

}
