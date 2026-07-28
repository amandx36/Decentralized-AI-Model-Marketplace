package com.aimarketplace.aimarketplace.service.impl;

import com.aimarketplace.aimarketplace.dto.response.AuthResponse;
import com.aimarketplace.aimarketplace.entity.User;
import com.aimarketplace.aimarketplace.repository.UserRepository;
import com.aimarketplace.aimarketplace.security.jwt.JwtService;
import com.aimarketplace.aimarketplace.security.jwt.Web3SignatureUtil;
import com.aimarketplace.aimarketplace.service.AuthService;
import com.aimarketplace.aimarketplace.service.NonceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;


@Service
public class AuthServiceimpl implements AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private NonceService nonceService;

    @Value("${jwt.expiration:86400000}")
    private long expiration;

    @Override
    public String generateAndSaveNonce(String walletAddress) {
        User user = userRepository.findByWalletAddress(walletAddress)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setWalletAddress(walletAddress);
                    newUser.setCreatedAt(Instant.now());
                    return userRepository.save(newUser);
                });

        return nonceService.generateAndSaveNonce(walletAddress);
    }

    @Override
    public AuthResponse verifyAndLogin(String walletAddress, String message, String signature) {
        User user = userRepository.findByWalletAddress(walletAddress)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String storedNonce = nonceService.getNonce(walletAddress);
        if (storedNonce == null) {
            throw new RuntimeException("Nonce not found or expired");
        }

        if (!message.equals(storedNonce)) {
            throw new RuntimeException("Invalid nonce");
        }

        String recoveredAddress = Web3SignatureUtil.recoverAddress(message, signature);
        if (!recoveredAddress.equalsIgnoreCase(walletAddress)) {
            throw new RuntimeException("Signature mismatch");
        }

        nonceService.deleteNonce(walletAddress);

        String accessToken = jwtService.generateToken(walletAddress);
        String refreshToken = jwtService.generateRefreshToken(walletAddress);

        user.setModifiedAt(Instant.now());
        userRepository.save(user);

        String role = user.getRoles() != null && !user.getRoles().isEmpty()
                ? user.getRoles().iterator().next().getName()
                : "ROLE_USER";

        return new AuthResponse(
            accessToken,
            refreshToken,
            walletAddress,
            role,
            "Login successful",
            expiration / 1000
        );
    }

    @Override
    public AuthResponse refreshToken(String refreshToken) {
        String walletAddress = jwtService.extractWalletAddress(refreshToken);
        String newAccessToken = jwtService.refreshAccessToken(refreshToken);

        User user = userRepository.findByWalletAddress(walletAddress)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String role = user.getRoles() != null && !user.getRoles().isEmpty()
                ? user.getRoles().iterator().next().getName()
                : "ROLE_USER";

        return new AuthResponse(
            newAccessToken,
            refreshToken,
            walletAddress,
            role,
            "Token refreshed successfully",
            expiration / 1000
        );
    }
}

