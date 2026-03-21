package com.aimarketplace.aimarketplace.service;

import com.aimarketplace.aimarketplace.dto.request.LoginRequest;
import com.aimarketplace.aimarketplace.dto.response.LoginResponse;

public interface AuthService {

    String generateAndSaveNonce(String walletAddress);
    String verifyAndLogin(String walletAddress , String message , String signature );
}
