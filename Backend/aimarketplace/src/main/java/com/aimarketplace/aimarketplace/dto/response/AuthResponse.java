package com.aimarketplace.aimarketplace.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;
    private String refreshToken;
    private String walletAddress;
    private String role;
    private String message;
    private long expiresIn;
}
