package com.aimarketplace.aimarketplace.service;

import com.aimarketplace.aimarketplace.dto.response.AuthResponse;

public interface AuthService {

    String generateAndSaveNonce(String walletAddress);
    AuthResponse verifyAndLogin(String walletAddress, String message, String signature);
    AuthResponse refreshToken(String refreshToken);
}

