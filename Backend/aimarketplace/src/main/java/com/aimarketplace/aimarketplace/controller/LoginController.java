package com.aimarketplace.aimarketplace.controller;


import com.aimarketplace.aimarketplace.dto.request.LoginRequest;
import com.aimarketplace.aimarketplace.dto.request.NonceRequest;
import com.aimarketplace.aimarketplace.dto.response.LoginResponse;
import com.aimarketplace.aimarketplace.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class LoginController {

    @Autowired
    private AuthService authService;


    @PostMapping("/login")
    public LoginResponse login (@RequestBody LoginRequest request){

        return authService.verifyLogin(request);
    }

    // method for request noince
    @PostMapping("/request-nonce")
    public ResponseEntity<?> requestNonce(@RequestBody NonceRequest request){
        String nonce = authService.generateAndSaveNonce(request.getWalletAddress());
        return RequestEntity.ok("nonce", nonce);
    }

}
